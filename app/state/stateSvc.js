import PubSub from "pubsub-js";

function stateSvc(
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
    svc.arrayMove(svc.config.chapters[svc.getChapterIndex()].layers, from, to);
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

    for (let i = 0; i < layerCount; i += 1) {
      if (chapter.layers[i].name === layerName) {
        chapter.layers[i].styleName = styleName;
      }
    }
  };

  /**
   * Gets storypins and storyframes for the given mapstory id from the server.
   * @param storyId The mapstory id.
   */
  svc.fetchComponentsFromAPI = storyId =>
    fetch(`/api/mapstories/${storyId}`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        PubSub.publish("updateStorypins", data.chapters);
        PubSub.publish("updateStoryframes", data.chapters);
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
    fetch("/api/categories/")
      .then(response => {
        return response.json();
      })
      .then((data) => {
        svc.categories = data.objects;
      });
  };

  svc.getCategories();

  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = (cookies[i]).trim();
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  let headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append("Content-Type", "application/json");
  headers.append("X-CSRFToken", getCookie("csrftoken"));

  svc.getUniqueStoryIdFromServer = () => {
    const config = svc.getConfig();
    return fetch("/story", {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
      body: JSON.stringify({
        about: {
          title: config.about.title,
          abstract: config.about.abstract,
          category: config.about.category
        },
        storyId: config.storyId || 0,
        isPublished: false,
        removedChapters: []
      })
    }).then(response => {
      return response.json();
    }).then(data => {
      config.storyId = data.id;
      return svc.set("storyId", data.id);
    }).catch((ex) => {
      console.log('getUniqueStoryIdFromServer error: ', ex);
    });
  }

  svc.getUniqueChapterIdFromServer = index => {
    let mapId = null;
    return new Promise(res => {
      const config = svc.getConfig();
      config.chapters[index].storyId = config.storyId;
      config.chapters[index].map.storyId = config.storyId;
      const chapterConfig = {...config.chapters[index]};
      return fetch("/story/chapter/new", {
        method: "POST",
        headers: headers,
        credentials: "same-origin",
        body: JSON.stringify(chapterConfig)
      }).then(response => {
        return response.json();
      }).then(data => {
        chapterConfig.mapId = data.id;
        mapId = chapterConfig.mapId;
        config.chapters[index].mapId = mapId;
        return svc.saveStoryPinsToServer(mapId)
          .then(() => {
            return svc.saveStoryFramesToServer(mapId)
          })
          .then(() => {
            return res();
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
      fetch(`/maps/${config.mapId}/data`, {
        method: "PUT",
        headers: headers,
        credentials: "same-origin",
        body: JSON.stringify(config)
      }).then(response => {
        return response.json();
      })
        .then(() => svc.saveStoryPinsToServer(config.mapId))
        .then(() => svc.saveStoryFramesToServer(config.mapId))
        .then(() => {
          res();
        });
    });

  svc.generateChapterPromiseQueue = () => {
    const {chapters} = svc.getConfig();
    const promises = [];
    for (let i = 0; i < chapters.length; i += 1) {
      if (!chapters[i].mapId) {
        promises.push(new Promise((resolve, reject) => {
          svc.getUniqueChapterIdFromServer(i)
        }));
      } else {
        promises.push(new Promise((resolve, reject) => {
          svc.updateChapterOnServer(i);
        }))
      }
      return promises;
    }
  };

  svc.updateLocationUsingStoryId = () => {
    const storyId = svc.getConfig().storyId;
    window.location.href = `/story/${storyId}/draft`;
  };

  svc.saveStoryToServer = () => {
    const config = svc.getConfig();
    // Make a copy so that we don't change the config in scope.
    const copiedConfig = angular.copy(config);
    if (copiedConfig.about.category.id) {
      copiedConfig.about.category = copiedConfig.about.category.id;
    }
    const storyId = svc.getConfig().storyId;
    return fetch(`/story/${storyId}/save`, {
      method: "PUT",
      headers: headers,
      credentials: "same-origin",
      body: JSON.stringify(copiedConfig)
    }).then(response => {
      return response.json();
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
    return fetch(`/maps/${mapId}/storypins`, {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
      body: JSON.stringify(pinArray)
    }).then(response => {
      return response.json();
    }).then(data => {
      return svc.updateStorypinIds(data.ids, chapterIndex);
    });
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

    const req = fetch(`/maps/${mapId}/storyframes`, {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
      body: JSON.stringify(frameArray)
    }).then(response => {
      return response.json();
    }).catch((ex) => {
        console.log('saveStoryFramesToServer: ', ex);
    });
    return req;
  };

  svc.generateStoryThumbnail = storyId => {
    return fetch(`/story/${storyId}/generate_thumbnail`, {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
    })
  };

  svc.save = () => {
    // first ensure that story has an id; then ensure chapters have ids
    const config = svc.getConfig();
    const retrieveChapterIdsAndSave = () =>
    svc.saveStoryToServer().then(() => {
        const p = svc.generateChapterPromiseQueue();
        return p;
      });
    if (!config.storyId) {
      svc.getUniqueStoryIdFromServer() // undefined, waiting on promise
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
