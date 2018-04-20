function MapManager(
  $http,
  $q,
  $log,
  $rootScope,
  $location,
  $compile,
  stStoryMapBuilder,
  stLocalStorageSvc,
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
  const svc = {};
  svc.storyMap = new EditableStoryMap({
    target: "map",
    overlayElement: document.getElementById("info-box")
  });

  window.storyMap = svc.storyMap;
  svc._config = {};
  svc.title = "";
  svc.owner = "";
  svc.storyChapter = 1;
  svc.chapterCount = 1;

  svc.displayPinInfo = (pixel, pin) => {
    let feature = null;
    const embed_params = {
      nowrap: "on",
      maxwidth: 250,
      maxheight: 250
    };
    if (typeof pin == "undefined" || pin == null) {
      feature = svc.storyMap
        .getMap()
        .forEachFeatureAtPixel(pixel, (feature, layer) => feature);
    } else {
      feature = pin;
    }
    if (feature) {
      const overlays = svc.storyMap
        .getMap()
        .getOverlays()
        .getArray();

      let popup = null;
      const titleDescrip = `<div style="text-align:center;"><h4>${feature.get(
        "title"
      )}</h4></div><hr>${feature.get("content")}`;
      const geometry = feature.getGeometry();
      const coord = geometry.getCoordinates();
      for (let iOverlay = 0; iOverlay < overlays.length; iOverlay += 1) {
        const overlay = overlays[iOverlay];
        if (overlay.getId && overlay.getId() === `popup-${feature.id}`) {
          popup = overlay;
          break;
        }
      }

      if (popup === null) {
        const popupOptions = {
          insertFirst: false,
          id: `popup-${feature.id}`,
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
          .then(result => {
            const cont = result ? titleDescrip + result : titleDescrip;
            popup.show(coord, cont);
          });
      } else {
        popup.show(coord, titleDescrip);
      }
    }
  };

  svc.loadMapFromID = options => {
    stStoryMapBuilder.modifyStoryMap(svc.storyMap, options);
    for (let i = 0; i < options.layers.length; i++) {
      svc.buildStoryLayer(options.layers[i]);
    }
  };

  svc.loadMapFromUrl = options => {
    const mapLoad = $http
      .get(options.url)
      .then(response => {
        stEditableStoryMapBuilder.modifyStoryMap(svc.storyMap, response.data);
      })
      .catch((data, status) => {
        if (status === 401) {
          window.console.warn(`Not authorized to see map ${mapId}`);
          stStoryMapBaseBuilder.defaultMap(svc.storyMap);
        }
      });
  };

  svc.loadMap = options => {
    options = options || {};
    if (options.id !== null && options.id !== undefined) {
      svc.loadMapFromID(options);
    } else if (options.url) {
      svc.loadMapFromUrl(options);
    } else {
      stStoryMapBaseBuilder.defaultMap(svc.storyMap);
    }
    svc.storyMap.getMap().on("click", evt => {
      const coordinate = evt.coordinate;
      const hdms = ol.coordinate.toStringHDMS(
        ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326")
      );
    });
    svc.currentMapOptions = options;
  };

  svc.initMapLoad = () => {
    const config = stateSvc.getChapterConfig();
    if (!config) {
      return;
    }
    svc.title = config.about.title;
    svc.username = config.about.username;
    svc.owner = config.about.owner;
    svc.loadMap(config);
  };

  svc.buildStoryLayer = options =>
    stEditableLayerBuilder
      .buildEditableLayer(options, svc.storyMap.getMap())
      .then(a => {
        if (options.styleName) {
          const layer = a.getLayer();
          let layerSource = layer.getSource();
          layerSource.updateParams({
            _dc: new Date().getTime(),
            _olSalt: Math.random(),
            STYLES: options.styleName
          });
        }
        svc.storyMap.addStoryLayer(a);
        if (options.settings.fitExtent === true) {
          const extent = a.get("extent");
          // prevent getting off the earth
          extent[1] = Math.max(-20037508.34, Math.min(extent[1], 20037508.34));
          extent[3] = Math.max(-20037508.34, Math.min(extent[3], 20037508.34));
          svc.storyMap
            .getMap()
            .getView()
            .fit(extent, svc.storyMap.getMap().getSize());
        }
      });

  svc.addLayer = (name, settings, server, fitExtent, styleName, title) => {
    const options = layerOptionsSvc.getLayerOptions(
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
