function stateSvc(
  $http,
  $location,
  $rootScope,
  $q,
  stAnnotationsStore,
  stLocalStorageSvc,
  newConfigSvc,
  searchSvc,
  utils
) {
  const svc = {};
  svc.currentChapter = null;
  svc.originalConfig = null;
  svc.config = null;

  svc.addNewChapter = () => {
    svc.config.chapters.push(
      newConfigSvc.getChapterConfig(svc.config.chapters.length + 1)
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
    svc.config = newConfigSvc.getMapstoryConfig();
    window.config = svc.config;
    svc.originalConfig = window.config;
    $rootScope.$broadcast("configInitialized");
    console.log(window.config);
  }

  svc.initConfig = () => {
    const path = window.location.pathname;
    const mapID = /\/story\/([A-Za-z0-9]+)/.exec(path)
      ? /\/story\/([A-Za-z0-9]+)/.exec(path)[1]
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
          console.log("> ORIGINAL DATA -- >", data);
          svc.config = newConfigSvc.getMapstoryConfig(data);
          window.config = svc.config;
          // @TODO: find a permanent home for this function
          window.config.getTempStyleName = storyLayerName => {
            const config = window.config;
            const idParts = {
              user: config.about.owner.username,
              slug: config.about.slug,
              chapter: svc.getChapter(),
              layerName: storyLayerName
            };
            const tempStyleName = `TEMP_${idParts.user}_${idParts.slug}-${
              idParts.chapter
            }-${idParts.layerName}`;
            return tempStyleName;
          };
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
    const featureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: null,
          properties: {
            title: frameSettings.title,
            start_time: frameSettings.startTime,
            end_time: frameSettings.endTime,
            extent: [
              [frameSettings[0].bb1[0], frameSettings[0].bb1[0]],
              [frameSettings[0].bb2[0], frameSettings[0].bb2[1]],
              [frameSettings[0].bb3[0], frameSettings[0].bb3[1]],
              [frameSettings[0].bb4[0], frameSettings[0].bb4[1]]
            ]
          }
        }
      ]
    };
    svc.config.frameSettings = featureCollection;
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
            category: "" // @TODO: populate category
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
      chapterConfig.map.layers = chapterConfig.map.layers.filter(
        layer => layer.group !== "background"
      );
      $http({
        url: "/story/chapter/new",
        method: "POST",
        data: JSON.stringify(chapterConfig)
      }).then(data => {
        chapterConfig.map_id = data.data.id;
        mapId = chapterConfig.map_id;
        svc.setChapterConfig(index, chapterConfig);
        return svc.saveStoryPinsToServer(mapId).then(() => {
          res();
          // @TODO: svc.saveStoryFramesToServer(mapId).then(() => res());
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
      config.map.layers = config.map.layers.filter(
        layer => layer.group !== "background"
      );
      $http({
        url: `/maps/${config.map_id}/data`,
        method: "PUT",
        data: JSON.stringify(config)
      })
        .then(() => svc.saveStoryPinsToServer(config.map_id))
        .then(() => svc.saveStoryFramesToServer(config.map_id))
        .then(() => {
          console.log("updateChapterOnServer worked");
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
    console.log("saveStoryToServer happened");
    const storyId = svc.getConfig().story_id;
    return $http({
      url: `/story/${storyId}/save`,
      method: "PUT",
      data: JSON.stringify(svc.getConfig())
    }).then(
      response => {
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
    const req = $http({
      url: `/maps/${mapId}/storypins`,
      method: "POST",
      data: JSON.stringify(pins[chapterIndex])
    });
    return req;
  };

  svc.saveStoryFramesToServer = mapId => {
    const config = svc.getConfig();
    const frames = config.frameSettings;
    const chapterIndex = svc.getChapterIndexByMapId(mapId);
    const req = $http({
      url: `/maps/${mapId}/storyframes`,
      method: "POST",
      data: JSON.stringify(frames[chapterIndex])
    });
    return req;
  };

  svc.save = () => {
    // first ensure that story has an id; then ensure chapters have ids
    const { story_id } = svc.getConfig();
    const retrieveChapterIdsAndSave = () =>
      svc.saveStoryToServer().then(() => {
        const p = svc.generateChapterPromiseQueue();
        return p;
      });
    if (!story_id) {
      svc
        .getUniqueStoryIdFromServer()
        .then(() => {
          const p = retrieveChapterIdsAndSave();
          return p;
        })
        .then(() => {
          svc.updateLocationUsingStoryId();
        });
    } else {
      retrieveChapterIdsAndSave();
    }
  };

  svc.save_storypins = storypins => {
    svc.config.storypins = storypins;
  };

  svc.get_storypins = () => {
    if (svc.config.storypins) {
      return svc.config.storypins;
    }
    // Lazy init an array of arrays to hold chapters with storypins.
    svc.config.storypins = [[]];
    return svc.config.storypins;
  };

  return svc;
}

module.exports = stateSvc;
