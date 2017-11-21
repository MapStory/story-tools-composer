function stateSvc(
  $location,
  $rootScope,
  $q,
  stAnnotationsStore,
  stLocalStorageSvc,
  newConfigSvc,
  searchSvc,
  utils
) {
  var svc = {};
  svc.currentChapter = null;
  svc.originalConfig = null;
  svc.config = null;

  svc.addNewChapter = function() {
    svc.config.chapters.push(
      newConfigSvc.getChapterConfig(svc.config.chapters.length + 1)
    );
  };

  svc.reorderLayer = function(from, to) {
    svc.config.chapters[svc.getChapterIndex()].layers.move(from, to);
  };

  svc.getLayerSaveConfig = function getLayerSaveConfig(layer) {
    var config = layer.get("metadata").config;
    var styleStorageService = storytools.edit.styleStorageService.styleStorageService();

    var jsonStyle = styleStorageService.getSavedStyle(
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
    var serverIndex = serverService_.getServerIndex(config.source);
    if (serverIndex > -1) {
      config.source = serverIndex;
    }
    if (goog.isDefAndNotNull(jsonStyle)) {
      config.jsonstyle = jsonStyle;
    }
    config.visibility = layer.get("visible");
    if (goog.isDefAndNotNull(layer.get("metadata").dimensions)) {
      var dimension = layer.get("metadata").dimensions[0];
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
      for (var i in layer.get("metadata").schema) {
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

  svc.initConfig = (function() {
    console.log(" >>> INIT CONFIG");
    var path = window.location.pathname;
    var mapID = /\/story\/(\d+)/.exec(path)
      ? /\/story\/(\d+)/.exec(path)[1]
      : null;
    console.log(mapID);
    var mapJsonUrl = "/api/mapstories/" + mapID;
    if (svc.config) {
      console.log("SERVICE CONFIG ALREADY EXISTS");
      return;
    } else if (mapID) {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl
      }).done(function(data) {
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
  })();

  svc.getConfig = function() {
    return svc.config;
  };

  svc.setConfig = function(config) {
    svc.config = config;
  };

  svc.updateCurrentChapterConfig = function() {
    svc.currentChapter = svc.getChapterConfig();
  };

  svc.addLayer = function(layerOptions) {
    console.log("LAYER OPTIONS", layerOptions);
    svc.config.chapters[svc.getChapterIndex()].layers.push(layerOptions);
  };

  // !DJA @TODO: write test
  svc.removeLayer = function(uuid) {
    var layers = svc.config.chapters[svc.getChapterIndex()].layers;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].uuid === uuid) {
        var index = layers.indexOf(layers[i]);
        if (index > -1) {
          svc.config.chapters[svc.getChapterIndex()].layers.splice(index, 1);
        }
      }
    }
  };

  svc.getChapter = function() {
    var chapter = 1;
    var path = $location.path();
    var matches;
    if (path && path.indexOf("/chapter") === 0) {
      if ((matches = /\d+/.exec(path)) !== null) {
        chapter = matches[0];
      }
    }
    return parseInt(chapter);
  };

  svc.getChapterIndex = function() {
    return svc.getChapter() - 1;
  };

  svc.getChapterConfig = function() {
    var chapter = svc.getChapter();
    var config = svc.getConfig();
    if (!config) {
      return;
    }
    var i = chapter - 1;
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

  svc.getChapterAbout = function() {
    return svc.getChapterConfig().about;
  };

  svc.getChapterConfigs = function() {
    var config = svc.getConfig();
    return config.chapters;
  };

  svc.getChapterCount = function() {
    return svc.getChapterConfigs() ? svc.getChapterConfigs().length : 0;
  };

  svc.save = function() {
    var config = window.storyMap.getState();
    console.log(" CONFIG ON SAVE ---- >", config);
    var layers = window.storyMap.getStoryLayers();
    layers.forEach(function(lyr) {
      console.log("    LAYER CONFIG -- >", svc.getLayerSaveConfig(lyr));
    });
    stLocalStorageSvc.saveConfig(config);
    if (window.storyMap.get("id") === undefined) {
      window.storyMap.set("id", config.id);
    }
    stAnnotationsStore.saveAnnotations(
      window.storyMap.get("id"),
      StoryPinLayerManager.storyPins
    );
  };

  return svc;
}

module.exports = stateSvc;
