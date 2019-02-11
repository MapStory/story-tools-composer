import MapConfigTransformer from "../mapstory/MapConfigTransformer";

const stStoryMapBuilder = ($rootScope, $compile, stLayerBuilder, stStoryMapBaseBuilder) => ({
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

      storymap.setCenter(mapConfig.map.center);
      storymap.setZoom(mapConfig.map.zoom);
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
        stLayerBuilder
          .buildLayer(layerConfig, storymap.getMap())
          .then(((index, sl) => {
            storymap.addStoryLayer(sl, index);
          }).bind(this, i));
      }
    }
    storymap.getMap().setView(
      new ol.View({
        center: mapConfig.map.center,
        zoom: mapConfig.map.zoom,
        minZoom: 3,
        maxZoom: 17
      })
    );
  }
});

export default stStoryMapBuilder;