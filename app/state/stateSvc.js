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

  svc.initConfig = () => {
    const path = window.location.pathname;
    const mapID = /\/story\/(\d+)/.exec(path)
      ? /\/story\/(\d+)/.exec(path)[1]
      : null;
    const mapJsonUrl = `/api/mapstories/${mapID}`;
    if (svc.config) {
      return;
    } else if (mapID) {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl
      }).done(data => {
        svc.config = newConfigSvc.getMapstoryConfig(data);
        window.config = svc.config;
        svc.originalConfig = data;
        $rootScope.$broadcast("configInitialized");
      });
    } else {
      svc.config = newConfigSvc.getMapstoryConfig();
      window.config = svc.config;
      svc.originalConfig = window.config;
      $rootScope.$broadcast("configInitialized");
    }
  };

  svc.getConfig = () => svc.config;

  svc.setConfig = config => {
    svc.config = config;
  };

  svc.updateCurrentChapterConfig = () => {
    svc.currentChapter = svc.getChapterConfig();
  };

  svc.addLayer = layerOptions => {
    svc.config.chapters[svc.getChapterIndex()].layers.push(layerOptions);
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
      } else {
        return config.chapters[0];
      }
    } else {
      return config;
    }
  };

  svc.getChapterAbout = () => svc.getChapterConfig().about;

  svc.getChapterConfigs = () => {
    const config = svc.getConfig();
    return config.chapters;
  };

  svc.getChapterCount = () => svc.getChapterConfigs() ? svc.getChapterConfigs().length : 0;

  svc.initConfig();
  svc.save = function() {
    console.log(svc.config);
    $http({
      url:'/mapstory/save',
      method:'POST',
      data: JSON.stringify(svc.config)
    }).then(function successCallback(response) {
      console.log("MAP SAVED");
    }, function errorCallback(response) {
      console.log("MAP FAILED TO SAVE");
    });
  };

  return svc;
}

module.exports = stateSvc;
