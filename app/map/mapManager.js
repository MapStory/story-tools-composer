function MapManager(
  $http,
  $rootScope,
  appConfig,
  stStoryMapBuilder,
  stEditableLayerBuilder,
  EditableStoryMap,
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
  svc.title = "";
  svc.owner = "";

  svc.getChapterCount = () => stateSvc.getConfig().chapters.length;

  svc.loadMapFromID = options => {
    stStoryMapBuilder.modifyStoryMap(svc.storyMap, options);
    for (let i = 0; i < options.layers.length; i += 1) {
      svc.buildStoryLayer(options.layers[i]);
    }
    if (window.mapstory.layerViewerMode) {
      svc.addLayer({
        name: window.mapstory.layername,
        server: appConfig.servers[0]
      });
    }
  };

  svc.loadMap = options => {
    if (options.id !== null && options.id !== undefined) {
      svc.loadMapFromID(options);
    } else {
      stStoryMapBaseBuilder.defaultMap(svc.storyMap);
    }
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
          const layerSource = layer.getSource();
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
        // Brodcast so we can request the legend for this layer.
        $rootScope.$broadcast("layerAdded");
      });

  svc.addLayer = args => {
    const options = layerOptionsSvc.getLayerOptions(args);
    stateSvc.addLayer(options);
    return svc.buildStoryLayer(options);
  };

  return svc;
}

export default MapManager;
