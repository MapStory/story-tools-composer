
const stStoryMapBaseBuilder = ($rootScope, $compile, stBaseLayerBuilder) => ({
  defaultMap(storymap) {
    storymap
      .getMap()
      .setView(
        new ol.View({ center: [0, 0], zoom: 3, minZoom: 3, maxZoom: 16 })
      );
    this.setBaseLayer(storymap, {
      title: "World Topo Map",
      type: "ESRI",
      name: "world-topo-map"
    });
  },
  setBaseLayer(storymap, data) {
    const baseLayer = stBaseLayerBuilder.buildLayer(data);
    storymap.setBaseLayer(baseLayer);
  }
});

export default stStoryMapBaseBuilder;