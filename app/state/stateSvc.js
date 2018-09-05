import PubSub from "pubsub-js";

function stateSvc(
  $http,
  $location,
  $q,
  stAnnotationsStore,
  stLocalStorageSvc,
  configSvc
) {
  const svc = {};
  svc.currentChapter = null;
  svc.originalConfig = null;
  svc.config = null;
  svc.frameSettings = null;

  svc.addNewChapter = () => {
    svc.config.chapters.push(
      configSvc.generateChapterConfig(svc.config.chapters.length + 1)
    );
  };

  svc.removeChapter = chapterId => {
    const index = chapterId - 1;
    if (svc.config.chapters[index].mapId) {
      svc.config.removedChapters.push(svc.config.chapters[index].mapId);
    }
    svc.config.chapters.splice(index, 1);

    for (let i = 0; i < svc.config.chapters.length; i += 1) {
      svc.config.chapters[i].index = i + 1;
    }
  };

  // mutates the input array
  svc.arrayMove = (array, oldIndex, newIndex) => {
    if (newIndex >= array.length) {
      let k = newIndex - array.length;
      while (k) {
        array.push(undefined);
        k -= 1;
      }
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array; // for testing purposes
  };

  svc.reorderLayer = (from, to) => {
    let arr = [];
    if (svc.config.mapManager) {
      arr = svc.config.mapManager.storyMap.getMap().getLayers().getArray();
    }
    svc.arrayMove(svc.config.chapters[svc.getChapterIndex()].layers, from, to);
    svc.arrayMove(svc.config.chapters[svc.getChapterIndex()].map.layers, from, to);
    arr.forEach(layer => {
      if (layer.getSource() && layer.getSource().getParams) {
        const layerName = layer.getSource().getParams().LAYERS;
        const zIndex = svc.config.chapters[svc.getChapterIndex()].layers.findIndex(item =>
          item.name === layerName
        );
        layer.setZIndex(zIndex);
      }
    });
  };

  function initializeNewConfig() {
    svc.config = configSvc.getMapstoryConfig();
    window.config = svc.config;
    svc.originalConfig = window.config;
    PubSub.publish("configInitialized");
  }

  svc.initConfig = () => {
    const path = window.location.pathname;
    const mapID = /\/story\/([A-Za-z0-9-_]+)/.exec(path)
      ? /\/story\/([A-Za-z0-9-_]+)/.exec(path)[1]
      : null;
    const mapJsonUrl = Number.isNaN(Number(mapID))
      ? `/api/mapstories/slug/${mapID}`
      : `/api/mapstories/${mapID}`;
    if (mapID && mapID !== "new") {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl
      })
        .done(data => {
          svc.config = configSvc.getMapstoryConfig(data);
          window.config = svc.config;
          svc.originalConfig = data;
          PubSub.publish("configInitialized");
        })
        .fail(() => {
          initializeNewConfig();
        });
    } else {
      initializeNewConfig();
    }
  };

  svc.getConfig = () => svc.config;

  svc.setConfig = config => {
    svc.config = config;
  };

  svc.set = (k, v) => {
    svc.config[k] = v;
  };

  svc.updateCurrentChapterConfig = () => {
    svc.currentChapter = svc.getChapterConfig();
  };

  svc.addLayer = layerOptions => {
    svc.config.chapters[svc.getChapterIndex()].layers.push(layerOptions);
    svc.config.chapters[svc.getChapterIndex()].map.layers.push(layerOptions);
  };

  svc.updateLayerStyle = (layerName, styleName) => {
    const chapter = svc.config.chapters[svc.getChapterIndex()];
    const layerCount = chapter.layers.length;
    const layerArray = svc.config.mapManager.storyMap.getStoryLayers().getArray();

    for (let i = 0; i < layerCount; i += 1) {
      if (chapter.layers[i].name === layerName) {
        chapter.layers[i].styleName = styleName;
      }
    }

    layerArray.forEach(layer => {
      if (layer.get("name") === layerName) {
        layer.set("styleName", styleName);
      }
    });
    PubSub.publish("layerUpdated");
  };

  /**
   * Gets storypins and storyframes for the given mapstory id from the server.
   * @param storyId The mapstory id.
   */
  svc.fetchComponentsFromAPI = storyId =>
    $http({
      url: `/api/mapstories/${storyId}`,
      method: "GET"
    }).then(data => {
      PubSub.publish("updateStorypins", data.data.chapters);
      PubSub.publish("updateStoryframes", data.data.chapters);
    });

  /**
   * Event responder for Init has finished.
   */
  PubSub.subscribe("configInitialized", () => {
    // This means we are in a new temp mapstory. No id has been created for this yet.
    if (svc.isTempStory()) {
      // Initialize empty arrays for storypins
      svc.getConfig().storypins = [[]];
    } else {
      // Data should exist for this mapstory. Get saved components from API:
      svc.fetchComponentsFromAPI(svc.getConfig().storyId);
    }
  });

  /**
   * True if this is a temp unsaved mapstory.
   * @returns {boolean} True if this is a temp unsaved mapstory.
   */
  svc.isTempStory = () => {
    if (svc.getConfig().storyId === 0) {
      return true;
    }
    return false;
  };

  // !DJA @TODO: write test
  svc.removeLayer = uuid => {
    const layers = svc.config.chapters[svc.getChapterIndex()].layers;
    for (let i = 0; i < layers.length; i += 1) {
      if (layers[i].uuid === uuid) {
        const index = layers.indexOf(layers[i]);
        if (index > -1) {
          svc.config.chapters[svc.getChapterIndex()].layers.splice(index, 1);
        }
      }
    }
  };

  svc.setStoryframeDetails = frameSettings => {
    svc.config.frameSettings = [];
    const features = [];
    for (let i = 0; i < frameSettings.length; i += 1) {
      features.push({
        type: "Feature",
        geometry: null,
        properties: {
          id: Date.now(),
          chapter: frameSettings[i].chapter,
          title: frameSettings[i].title,
          start_time: frameSettings[i].startDate,
          end_time: frameSettings[i].endDate,
          center: [
            [frameSettings[i].bb1[0], frameSettings[i].bb1[1]],
            [frameSettings[i].bb2[0], frameSettings[i].bb2[1]],
            [frameSettings[i].bb3[0], frameSettings[i].bb3[1]],
            [frameSettings[i].bb4[0], frameSettings[i].bb4[1]]
          ]
        }
      });
      const featureCollection = {
        type: "FeatureCollection",
        features
      };
      svc.config.frameSettings[svc.getChapterIndex()] = featureCollection;
      svc.saveStoryframes(svc.config.frameSettings);
    }
  };

  svc.getChapter = () => {
    let chapter = 1;
    const path = $location.path();
    if (path && path.indexOf("/chapter") === 0) {
      const matches = /\d+/.exec(path);
      if (matches !== null) {
        chapter = matches[0];
      }
    }
    return parseInt(chapter, 10);
  };

  svc.getChapterIndex = () => svc.getChapter() - 1;

  svc.getChapterConfig = () => {
    const chapter = svc.getChapter();
    const config = svc.getConfig();
    if (!config) {
      return undefined;
    }
    const i = chapter - 1;
    if (config.chapters && chapter > 0 && chapter <= config.chapters.length) {
      if (config.chapters[i]) {
        return config.chapters[i];
      }
      return config.chapters[0];
    }
    return config;
  };

  svc.updateBaseLayer = baselayer => {
    const layers = svc.config.chapters[svc.getChapterIndex()].map.layers;
    /*
     The first base layer in the config when a map is reloaded will be set as `selected`
    */
    const replacedBaselayer = layers[0];
    let selectedBaseLayerIndex = null;
    for (let i = 0; i < layers.length; i += 1) {
      if (baselayer.name === layers[i].name) {
        selectedBaseLayerIndex = i;
        layers[i].visibility = true;
        layers[i].selected = true;
        layers[0] = layers[selectedBaseLayerIndex];
        layers[selectedBaseLayerIndex] = replacedBaselayer;
      } else {
        layers[i].visibility = false;
        layers[i].selected = false;
      }
    }
  };

  svc.getChapterAbout = () => svc.getChapterConfig().about;

  svc.getChapterConfigs = () => {
    const config = svc.getConfig();
    return config.chapters;
  };

  svc.getChapterCount = () => {
    if (!svc.getConfig()) {
      return false;
    }
    return svc.getChapterConfigs() ? svc.getChapterConfigs().length : 0;
  };

  svc.initConfig();

  svc.getCategories = () => {
    $http({
      url: "/api/categories/",
      method: "GET"
    }).then(data => {
      svc.categories = data.data.objects;
    });
  };

  svc.getCategories();

  svc.getUniqueStoryIdFromServer = () =>
    new Promise(res => {
      const config = svc.getConfig();
      $http({
        url: "/story",
        method: "POST",
        data: JSON.stringify({
          about: {
            title: config.about.title,
            abstract: config.about.abstract,
            category: config.about.category
          },
          storyId: config.storyId || 0,
          isPublished: false,
          removedChapters: []
        })
      }).then(data => {
        config.storyId = data.data.id;
        svc.set("storyId", data.data.id);
        res();
      });
    });

  svc.getUniqueChapterIdFromServer = index => {
    let mapId = null;
    return new Promise(res => {
      const config = svc.getConfig();
      config.chapters[index].storyId = config.storyId;
      config.chapters[index].map.storyId = config.storyId;
      const chapterConfig = { ...config.chapters[index] };
      $http({
        url: "/story/chapter/new",
        method: "POST",
        data: JSON.stringify(chapterConfig)
      }).then(data => {
        chapterConfig.mapId = data.data.id;
        mapId = chapterConfig.mapId;
        config.chapters[index].mapId = mapId;
        svc
          .saveStoryPinsToServer(mapId)
          .then(() => svc.saveStoryFramesToServer(mapId))
          .then(() => {
            res();
          });
      });
    });
  };

  svc.setChapterConfig = (chapterIndex, config) => {
    svc.config.chapters[chapterIndex] = config;
  };

  svc.updateChapterOnServer = index =>
    new Promise(res => {
      const config = svc.getChapterConfigs()[index];
      $http({
        url: `/maps/${config.mapId}/data`,
        method: "PUT",
        data: JSON.stringify(config)
      })
        .then(() => svc.saveStoryPinsToServer(config.mapId))
        .then(() => svc.saveStoryFramesToServer(config.mapId))
        .then(() => {
          res();
        });
    });

  svc.generateChapterPromiseQueue = () => {
    const { chapters } = svc.getConfig();
    const promises = [];
    for (let i = 0; i < chapters.length; i += 1) {
      if (!chapters[i].mapId) {
        promises.push(svc.getUniqueChapterIdFromServer(i));
      } else {
        promises.push(svc.updateChapterOnServer(i));
      }
    }
    return $q.all(promises);
  };

  svc.updateLocationUsingStoryId = () => {
    const storyId = svc.getConfig().storyId;
    window.location.href = `/story/${storyId}/draft`;
  };

  svc.saveStoryToServer = () => {
    const config = svc.getConfig();
    delete config.mapManager;
    // Make a copy so that we don't change the config in scope.
    const copiedConfig = angular.copy(config);
    if (copiedConfig.about.category.id) {
      copiedConfig.about.category = copiedConfig.about.category.id;
    }
    const storyId = svc.getConfig().storyId;
    return $http({
      url: `/story/${storyId}/save`,
      method: "PUT",
      data: JSON.stringify(copiedConfig)
    });
  };

  svc.getChapterIndexByMapId = mapId => {
    const config = svc.getConfig();
    for (const chapter in config.chapters) {
      if (config.chapters[chapter].mapId === mapId) {
        return chapter;
      }
    }
    return false;
  };

  svc.saveStoryPinsToServer = mapId => {
    const pins = svc.getStorypins();
    const chapterIndex = svc.getChapterIndexByMapId(mapId);
    const pinArray = pins[chapterIndex] || [];
    const req = $http({
      url: `/maps/${mapId}/storypins`,
      method: "POST",
      data: JSON.stringify(pinArray)
    }).then(data => {
      svc.updateStorypinIds(data.data.ids, chapterIndex);
    });
    return req;
  };

  /**
   * Broadcasts an event for new storypins being created, so that their new ids can be updated by the Pin manager.
   * @param idArray
   * @param chapterId
   */
  svc.updateStorypinIds = (idArray, chapterId) => {
    // Update the local things
    // Broadcast the change
    if (!idArray) {
      // No need to broadcast
      return;
    }
    PubSub.publish("loadids", idArray, chapterId);
  };

  svc.saveStoryFramesToServer = mapId => {
    const frames = svc.getStoryframes();
    const chapterIndex = svc.getChapterIndexByMapId(mapId);
    const frameArray = frames[chapterIndex] || [];

    const req = $http({
      url: `/maps/${mapId}/storyframes`,
      method: "POST",
      data: JSON.stringify(frameArray)
    });
    return req;
  };

  svc.generateStoryThumbnail = storyId =>
    $http({
      url: `/story/${storyId}/generate_thumbnail`,
      method: "POST"
    });

  svc.save = () => {
    // first ensure that story has an id; then ensure chapters have ids
    const config = svc.getConfig();
    const retrieveChapterIdsAndSave = () =>
      svc.saveStoryToServer().then(() => {
        const p = svc.generateChapterPromiseQueue();
        return p;
      });
    if (!config.storyId) {
      svc
        .getUniqueStoryIdFromServer()
        .then(() => {
          const p = retrieveChapterIdsAndSave();
          return p;
        })
        .then(() => {
          svc
            .generateStoryThumbnail(config.storyId)
            .then(() => svc.updateLocationUsingStoryId());
        });
    } else {
      retrieveChapterIdsAndSave().then(() =>
        svc.generateStoryThumbnail(config.storyId)
      );
    }
  };

  svc.publish = () => {
    const config = svc.getConfig();
    config.isPublished = true;
    svc.save();
  };

  /**
   * Sets the storypins to the config that will be saved.
   * @param storypins [[]] An Array chapters containing an array of Storypins each.
   */
  svc.setStoryPinsToConfig = storypins => {
    svc.config.storypins = storypins;
  };

  /**
   * Gets the current storypins held by the config.
   * @returns {*|Array[]}
   */
  svc.getStorypins = () => {
    if (svc.config.storypins) {
      return svc.config.storypins;
    }
    // Lazy init an array of arrays to hold chapters with storypins.
    svc.config.storypins = [[]];
    return svc.config.storypins;
  };

  svc.saveStoryframes = storyframes => {
    svc.config.storyframes = storyframes;
  };

  svc.getStoryframes = () => {
    if (svc.config.storyframes) {
      return svc.config.storyframes;
    }
    svc.config.storyframes = [[]];
    return svc.config.storyframes;
  };

  return svc;
}

export default stateSvc;
