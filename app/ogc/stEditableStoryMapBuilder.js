import MapConfigTransformer from "../mapstory/MapConfigTransformer";

const stEditableStoryMapBuilder = ($rootScope, $compile, stStoryMapBaseBuilder, stEditableLayerBuilder) => ({
  modifyStoryLayer(storylayer, newType) {
    const data = storylayer.getProperties();
    const storymap = storylayer.getStoryMap();
    data.type = newType || (data.type === "WMS" ? "VECTOR" : "WMS");
    if (data.type === "WMS") {
      delete data.features;
    }
    return stEditableLayerBuilder
      .buildEditableLayer(data, storymap.getMap())
      .then((sl) => {
        // sequence is important here, first change layer, then the type.
        storylayer.setLayer(sl.getLayer());
        storylayer.set("type", sl.get("type"));
      });
  },
  modifyStoryMap(storymap, data) {
    storymap.clear();
    const mapConfig = MapConfigTransformer(
      data
    );
    if (mapConfig.id >= 0) {
      storymap.set("id", mapConfig.id);
      storymap.setMode(mapConfig.playbackMode);
      if (data.about !== undefined) {
        storymap.setStoryTitle(data.about.title);
        storymap.setStoryAbstract(data.about.abstract);
        storymap.setStoryOwner(data.about.owner);
      }
    }
    for (let i = 0, ii = mapConfig.map.layers.length; i < ii; ++i) {
      const layerConfig = mapConfig.map.layers[i];
      if (
        layerConfig.group === "background" &&
        layerConfig.visibility === true
      ) {
        stStoryMapBaseBuilder.setBaseLayer(storymap, layerConfig);
      } else {
        /* jshint loopfunc: true */
        stEditableLayerBuilder
          .buildEditableLayer(layerConfig, storymap.getMap())
          .then((sl) => {
            // TODO insert at the correct index
            storymap.addStoryLayer(sl);
          });
      }
    }

    storymap.getMap().setView(
      new ol.View({
        center: mapConfig.map.center,
        zoom: mapConfig.map.zoom,
        projection: mapConfig.map.projection,
        minZoom: 3,
        maxZoom: 17
      })
    );
  }
});

export default stEditableStoryMapBuilder;