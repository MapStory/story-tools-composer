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
  layerSvc,
  popupSvc,
  layerOptionsSvc,
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

  svc.displayPinInfo = function(pixel, pin) {
    var feature = null;
    var embed_params = {
      nowrap: "on",
      maxwidth: 250,
      maxheight: 250
    };
    if (typeof pin == "undefined" || pin == null) {
      feature = svc.storyMap
        .getMap()
        .forEachFeatureAtPixel(pixel, function(feature, layer) {
          return feature;
        });
    } else {
      feature = pin;
    }
    if (feature) {
      var overlays = svc.storyMap
        .getMap()
        .getOverlays()
        .getArray();

      var popup = null;
      var titleDescrip =
        '<div style="text-align:center;"><h4>' +
        feature.get("title") +
        "</h4></div><hr>" +
        feature.get("content");
      var geometry = feature.getGeometry();
      var coord = geometry.getCoordinates();
      for (var iOverlay = 0; iOverlay < overlays.length; iOverlay += 1) {
        var overlay = overlays[iOverlay];
        if (overlay.getId && overlay.getId() == "popup-" + feature.id) {
          popup = overlay;
          break;
        }
      }

      if (popup === null) {
        var popupOptions = {
          insertFirst: false,
          id: "popup-" + feature.id,
          positioning: "bottom-center",
          stopEvent: false
        };
        popup = new ol.Overlay.Popup(popupOptions);
        svc.storyMap.getMap().addOverlay(popup);
        $rootScope.$broadcast("pausePlayback");
      }
      popup.setPosition(coord);
      if (feature.get("media")) {
        mediaService
          .getEmbedContent(feature.get("media"), embed_params)
          .then(function(result) {
            var cont = result ? titleDescrip + result : titleDescrip;
            popup.show(coord, cont);
          });
      } else {
        popup.show(coord, titleDescrip);
      }
    }
  };

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

  svc.loadMapFromID = function(options) {
    stStoryMapBuilder.modifyStoryMap(svc.storyMap, options);
    var annotationsLoad = svc.getDataFromLocalServer(options.id, "annotations");
    var boxesLoad = svc.getDataFromLocalServer(options.id, "boxes");
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
    if (options.id !== null && options.id !== undefined) {
      svc.loadMapFromID(options);
    } else if (options.url) {
      svc.loadMapFromUrl(options);
    } else {
      stStoryMapBaseBuilder.defaultMap(svc.storyMap);
    }
    svc.storyMap.getMap().on("click", function(evt) {
      var coordinate = evt.coordinate;
      var hdms = ol.coordinate.toStringHDMS(
        ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326")
      );
    });
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
    svc.loadMap(config);
  };

  svc.buildStoryLayer = function(options) {
    return stEditableLayerBuilder
      .buildEditableLayer(options, svc.storyMap.getMap())
      .then(function(a) {
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
    options = layerOptionsSvc.getLayerOptions(
      name,
      settings,
      server,
      fitExtent,
      styleName,
      title
    );
    stateSvc.addLayer(options);
    return svc.buildStoryLayer(options);
  };

  return svc;
}

module.exports = MapManager;
