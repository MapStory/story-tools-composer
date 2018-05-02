function stateSvc(
  $http,
  $location,
  $rootScope,
  $q,
  stAnnotationsStore,
  stLocalStorageSvc,
  configSvc,
  searchSvc,
  utils
) {
  const svc = {};
  svc.currentChapter = null;
  svc.originalConfig = null;
  svc.config = null;

  svc.addNewChapter = () => {
    svc.config.chapters.push(
      configSvc.generateChapterConfig(svc.config.chapters.length + 1)
    );
  };

  svc.removeChapter = chapterId => {
    const index = chapterId - 1;
    if (svc.config.chapters[index].map_id) {
      svc.config.removed_chapters.push(svc.config.chapters[index].map_id);
    }
    svc.config.chapters.splice(index, 1);

    for (let i = 0; i < svc.config.chapters.length; i += 1) {
      svc.config.chapters[i].index = i + 1;
    }
  };

  svc.reorderLayer = (from, to) => {
    svc.config.chapters[svc.getChapterIndex()].layers.move(from, to);
  };

  svc.getLayerSaveConfig = function getLayerSaveConfig(layer) {
    const config = layer.get("metadata").config;
    const styleStorageService = storytools.edit.styleStorageService.styleStorageService();

    const jsonStyle = styleStorageService.getSavedStyle(
      layer,
      map_config.chapter_index
    );

    if (!goog.isDefAndNotNull(config)) {
      console.log(
        "Not saving layer: ",
        layer.get("metadata").name,
        "because the layer does not have a configuration object."
      );
      return false;
    }

    // Note: when a server is removed, its id diverges from the index. since in geonode's config object it is all
    // index based, updating it to be the index in case the id is no longer the index
    const serverIndex = serverService_.getServerIndex(config.source);
    if (serverIndex > -1) {
      config.source = serverIndex;
    }
    if (goog.isDefAndNotNull(jsonStyle)) {
      config.jsonstyle = jsonStyle;
    }
    config.visibility = layer.get("visible");
    if (goog.isDefAndNotNull(layer.get("metadata").dimensions)) {
      const dimension = layer.get("metadata").dimensions[0];
      config.capability = {};
      config.capability.dimensions = {};
      config.capability.dimensions.time = dimension;
      if (dimension.values instanceof Array) {
        config.capability.dimensions.time.values = dimension.values;
      } else {
        config.capability.dimensions.time.values = dimension.values.split(",");
      }
    }
    if (goog.isDefAndNotNull(layer.get("metadata").schema)) {
      config.schema = [];
      for (const i in layer.get("metadata").schema) {
        config.schema.push({
          name: i,
          visible: layer.get("metadata").schema[i].visible
        });
      }
    } else if (goog.isDefAndNotNull(layer.get("metadata").savedSchema)) {
      config.schema = layer.get("metadata").savedSchema;
    }
    return config;
  };

  function initializeNewConfig() {
    svc.config = configSvc.getMapstoryConfig();
    window.config = svc.config;
    svc.originalConfig = window.config;
    $rootScope.$broadcast("configInitialized");
    console.log(window.config);
  }

  svc.initConfig = () => {
    const path = window.location.pathname;
    const mapID = /\/story\/([A-Za-z0-9-_]+)/.exec(path)
      ? /\/story\/([A-Za-z0-9-_]+)/.exec(path)[1]
      : null;
    const mapJsonUrl = isNaN(mapID)
      ? `/api/mapstories/slug/${mapID}`
      : `/api/mapstories/${mapID}`;
    if (svc.config) {
    } else if (mapID && mapID !== "new") {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl
      })
        .done(data => {
          svc.config = configSvc.getMapstoryConfig(data);
          window.config = svc.config;
          svc.originalConfig = data;
          $rootScope.$broadcast("configInitialized");
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
    for (let i = 0; i < layerCount; i += 1) {
      if (chapter.layers[i].name === layerName) {
        chapter.layers[i].styleName = styleName;
      }
    }
  };

  svc.getIndexedMapIds = () => {
    let indexedMapIds = [];
    const chapters = svc.getConfig().chapters;
    for (let i = 0; i < chapters.length; i += 1) {
      if (chapters[i].map_id) {
        indexedMapIds.push(chapters[i].map_id);
      }
    }
  };

  /**
   * Gets storypins and storyframes for the given mapstory id from the server.
   * @param story_id The mapstory id.
   */
  svc.fetchComponentsFromAPI = story_id => {
    return $http({
      url: `/api/mapstories/${story_id}`,
      method: "GET"
    }).then(data => {
      $rootScope.$broadcast("updateStorypins", data.data.chapters);
    });
  };

  $rootScope.$on("storyComponentsLoaded", (event, data) => {
    console.log("> STORY COMPONENT DATA LOADED", data);
  });

  /**
   * Event responder for Init has finished.
   */
  $rootScope.$on("configInitialized", (event, data) => {
    // This means we are in a new temp mapstory. No id has been created for this yet.
    if( svc.is_temp_story() ){
      // Initialize empty arrays for storypins
      svc.getConfig().storypins = [[]];
    } else {
      // Data should exist for this mapstory. Get saved components from API:
      svc.fetchComponentsFromAPI(svc.getConfig().story_id);
    }
  });

  /**
   * True if this is a temp unsaved mapstory.
   * @returns {boolean} True if this is a temp unsaved mapstory.
   */
  svc.is_temp_story = () => {
    if(svc.getConfig().story_id === 0) {
      return true;
    }
    return false;
  };

  // !DJA @TODO: write test
  svc.removeLayer = uuid => {
    const layers = svc.config.chapters[svc.getChapterIndex()].layers;
    for (let i = 0; i < layers.length; i++) {
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
    let features = [];
    for (let i = 0; i < frameSettings.length; i += 1) {
        features.push({
            type: "Feature",
            geometry: null,
            properties: {
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
    let matches;
    if (path && path.indexOf("/chapter") === 0) {
      if ((matches = /\d+/.exec(path)) !== null) {
        chapter = matches[0];
      }
    }
    return parseInt(chapter);
  };

  svc.getChapterIndex = () => svc.getChapter() - 1;

  svc.getChapterConfig = () => {
    const chapter = svc.getChapter();
    const config = svc.getConfig();
    if (!config) {
      return;
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
    let replacedBaselayer = layers[0];
    let selectedBaseLayerIndex = null;
    for (let i = 0; i < layers.length; i += 1) {
      if (baselayer.name == layers[i].name) {
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
      method: "GET",
    }).then(data => {
      console.log(data);
      svc.categories = data.data.objects;
      res();
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
            category: config.about.category,
          },
          story_id: config.story_id || 0,
          is_published: false,
          removed_chapters: []
        })
      }).then(data => {
        config.story_id = data.data.id;
        svc.set("story_id", data.data.id);
        res();
      });
    });

  svc.getUniqueChapterIdFromServer = index => {
    let mapId = null;
    return new Promise(res => {
      const config = svc.getConfig();
      config.chapters[index].story_id = config.story_id;
      config.chapters[index].map.story_id = config.story_id;
      const chapterConfig = { ...config.chapters[index] };
      $http({
        url: "/story/chapter/new",
        method: "POST",
        data: JSON.stringify(chapterConfig)
      }).then(data => {
        chapterConfig.map_id = data.data.id;
        mapId = chapterConfig.map_id;
        config.chapters[index].map_id = mapId;
        console.log(data);
        const chapterIndex = svc.getChapterIndexByMapId(mapId);
        svc.saveStoryPinsToServer(mapId)
        .then(() => svc.saveStoryFramesToServer(mapId))
        .then(() => {
          res();
        });
      })
    });
  };

  svc.setChapterConfig = (chapterIndex, config) => {
    svc.config.chapters[chapterIndex] = config;
  };

  svc.updateChapterOnServer = index =>
    new Promise(res => {
      const config = svc.getChapterConfigs()[index];
      $http({
        url: `/maps/${config.map_id}/data`,
        method: "PUT",
        data: JSON.stringify(config)
      })
        .then(() => svc.saveStoryPinsToServer(config.map_id))
        .then(() => svc.saveStoryFramesToServer(config.map_id))
        .then(() => {
          res();
        });
    });

  svc.generateChapterPromiseQueue = () => {
    const { chapters } = svc.getConfig();
    const promises = [];
    for (let i = 0; i < chapters.length; i += 1) {
      if (!chapters[i].map_id) {
        promises.push(svc.getUniqueChapterIdFromServer(i));
      } else {
        promises.push(svc.updateChapterOnServer(i));
      }
    }
    return $q.all(promises);
  };

  svc.updateLocationUsingStoryId = () => {
    const storyId = svc.getConfig().story_id;
    window.location.href = `/story/${storyId}/draft`;
  };

  svc.saveStoryToServer = () => {
    const storyId = svc.getConfig().story_id;
    return $http({
      url: `/story/${storyId}/save`,
      method: "PUT",
      data: JSON.stringify(svc.getConfig())
    }).then(
      response => {
        console.log(response);
        console.log("MAP SAVED");
      },
      response => {
        console.log("MAP FAILED TO SAVE");
      }
    );
  };

  svc.getChapterIndexByMapId = mapId => {
    const config = svc.getConfig();
    for (const chapter in config.chapters) {
      if (config.chapters[chapter].map_id === mapId) {
        return chapter;
      }
    }
    return false;
  };

  svc.saveStoryPinsToServer = mapId => {
    const pins = svc.get_storypins();
    const chapterIndex = svc.getChapterIndexByMapId(mapId);
    const pinArray = pins[chapterIndex] || [];
    const req = $http({
      url: `/maps/${mapId}/storypins`,
      method: "POST",
      data: JSON.stringify(pinArray)
    }).then( data => {
      svc.updateStorypinIds(data.data.ids, chapterIndex);
    });
    return req;
  };


  svc.updateStorypinIds = (idArray, chapterId) => {
    // Update the local things
    // Broadcast the change
    console.log("Brodacasting pin id change");
    $rootScope.$broadcast("loadids", idArray, chapterId);
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
    console.log(1);
    return req;
  };

  svc.generateStoryThumbnail = storyId => {
    return $http({
      url: `/story/${storyId}/generate_thumbnail`,
      method: "POST",
    });
  };

  svc.save = () => {
    // first ensure that story has an id; then ensure chapters have ids
    const config = svc.getConfig();
    const retrieveChapterIdsAndSave = () =>
       svc.saveStoryToServer().then(() => {
        const p = svc.generateChapterPromiseQueue();
        return p;
      });
    if (!config.story_id) {
      svc
        .getUniqueStoryIdFromServer()
        .then(() => {
          const p = retrieveChapterIdsAndSave();
          return p;
        })
        .then(() => {
          svc.generateStoryThumbnail(config.story_id)
            .then(() => svc.updateLocationUsingStoryId())
        });
    } else {
      retrieveChapterIdsAndSave()
        .then(() => svc.generateStoryThumbnail(config.story_id))
    }
  };

  svc.publish = () => {
    const config = svc.getConfig();
    config.is_published = true;
    svc.save();
  };

  // TODO: Fix this
  svc.save_storypins = storypins => {
    svc.config.storypins = storypins;
  };

  // TODO: Fix this
  svc.get_storypins = () => {
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

module.exports = stateSvc;
