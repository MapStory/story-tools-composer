function MapManager(
  $http,
  $q,
  $log,
  $rootScope,
  $location,
  $compile,
  StoryPinLayerManager,
  stStoryMapBuilder,
  stLocalStorageSvc,
  stAnnotationsStore,
  stEditableLayerBuilder,
  TimeControlsManager,
  EditableStoryMap,
  stStoryMapBaseBuilder,
  stateSvc,
  stEditableStoryMapBuilder
) {
  var svc = {};
  svc.storyMap = new EditableStoryMap({
    target: "map",
    overlayElement: document.getElementById("info-box")
  });

  window.storyMap = svc.storyMap;
  StoryPinLayerManager.map = svc.storyMap;
  //StoryBoxLayerManager.map = this.storyMap;
  svc._config = {};
  svc.title = "";
  svc.owner = "";
  svc.storyChapter = 1;
  svc.chapterCount = 1;
  StoryPinLayerManager.storyPinsLayer = svc.storyMap.storyPinsLayer;

  svc.getDataFromLocalServer = function(mapId, dataType) {
    return $http
      .get("/maps/" + mapId + "/" + dataType)
      .then(function(response) {
        return response;
      })
      .catch(function(data, status) {
        if (status === 404) {
          console.log("404 error");
          return "error";
        }
        return "error";
      });
  };

  svc.logselecteditem = function() {
    console.log(mapManager.storyMap.getSelectedItem());
  };

  svc.loadMapFromID = function(options) {
    stStoryMapBuilder.modifyStoryMap(svc.storyMap, options);
    var annotationsLoad = svc.getDataFromLocalServer(options.id, "annotations");
    var boxesLoad = svc.getDataFromLocalServer(options.id, "boxes");
    console.log(" LOAD MAP FROM ID WITH OPTIONS ---- >", options);
    for (var i = 0; i < options.layers.length; i++) {
      svc.buildStoryLayer(options.layers[i]);
    }
    $q.all([annotationsLoad, boxesLoad]).then(function(values) {
      if (values[0] !== "error") {
        StoryPinLayerManager.loadFromGeoJSON(
          values[0].data,
          svc.storyMap
            .getMap()
            .getView()
            .getProjection(),
          true
        );
      }
    });
  };

  svc.loadMapFromUrl = function(options) {
    var mapLoad = $http
      .get(options.url)
      .then(function(response) {
        stEditableStoryMapBuilder.modifyStoryMap(svc.storyMap, response.data);
      })
      .catch(function(data, status) {
        if (status === 401) {
          window.console.warn("Not authorized to see map " + mapId);
          stStoryMapBaseBuilder.defaultMap(svc.storyMap);
        }
      });
    var annotationsURL = options.url.replace("/data", "/annotations");
    if (annotationsURL.slice(-1) === "/") {
      annotationsURL = annotationsURL.slice(0, -1);
    }
    var annotationsLoad = $http.get(annotationsURL);
    $q.all([mapLoad, annotationsLoad]).then(function(values) {
      var geojson = values[1].data;
      StoryPinLayerManager.loadFromGeoJSON(
        geojson,
        svc.storyMap
          .getMap()
          .getView()
          .getProjection()
      );
    });
  };

  svc.loadMap = function(options) {
    options = options || {};
    if (options.id) {
      console.log(" > LOAD MAP FROM ID", options);
      svc.loadMapFromID(options);
    } else if (options.url) {
      console.log(" > LOAD MAP FROM URL");
      svc.loadMapFromUrl(options);
    } else {
      stStoryMapBaseBuilder.defaultMap(svc.storyMap);
    }
    svc.currentMapOptions = options;
  };

  svc.initMapLoad = function() {
    var config = stateSvc.getChapterConfig();
    if (!config) {
      return;
    }
    svc.title = config.about.title;
    svc.username = config.about.username;
    svc.owner = config.about.owner;
    console.log("---- > ", config);
    svc.loadMap(config);
  };

  svc.buildStoryLayer = function(options) {
    return stEditableLayerBuilder
      .buildEditableLayer(options, svc.storyMap.getMap())
      .then(function(a) {
        console.log("STORYLAYER --- >", a);
        svc.storyMap.addStoryLayer(a);
        if (fitExtent === true) {
          a.get("latlonBBOX");
          var extent = ol.proj.transformExtent(
            a.get("latlonBBOX"),
            "EPSG:4326",
            svc.storyMap
              .getMap()
              .getView()
              .getProjection()
          );
          // prevent getting off the earth
          extent[1] = Math.max(-20037508.34, Math.min(extent[1], 20037508.34));
          extent[3] = Math.max(-20037508.34, Math.min(extent[3], 20037508.34));
          svc.storyMap
            .getMap()
            .getView()
            .fitExtent(extent, svc.storyMap.getMap().getSize());
        }
      });
  };

  svc.addLayer = function(name, settings, server, fitExtent, styleName, title) {
    console.log(" ADD LAYER: ", name);
    svc.storyMap.setAllowZoom(settings.allowZoom);
    svc.storyMap.setAllowPan(settings.allowPan);
    if (fitExtent === undefined) {
      fitExtent = true;
    }
    if (angular.isString(server)) {
      server = getServer(server);
    }
    var workspace = "geonode";
    var parts = name.split(":");
    if (parts.length > 1) {
      workspace = parts[0];
      name = parts[1];
    }
    var url = server.path + workspace + "/" + name + "/wms";
    var id = workspace + ":" + name;
    var options = {
      id: id,
      uuid: new Date().getTime(),
      name: name,
      title: title || name,
      url: url,
      path: server.path,
      canStyleWMS: server.canStyleWMS,
      timeEndpoint: server.timeEndpoint ? server.timeEndpoint(name) : undefined,
      type: settings.asVector === true ? "VECTOR" : "WMS",
      settings: settings
    };
    stateSvc.saveLayer(options);
    return svc.buildStoryLayer(options);
  };

  return svc;
}

module.exports = MapManager;
