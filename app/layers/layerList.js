function layerList(
  stStoryMapBaseBuilder,
  stEditableStoryMapBuilder,
  MapManager,
  layerSvc,
  styleUpdater,
  stateSvc
) {
  return {
    restrict: "E",
    scope: {
      map: "=",
      selected: "@"
    },
    templateUrl: "./app/layers/templates/layer-list.html",
    link: (scope, el, atts) => {
      scope.baseLayers = layerSvc.baseLayers;
      scope.styleSvc = styleUpdater;
      scope.styleActivated = false;
      const baseLayer = MapManager.storyMap.get("baselayer");
      if (baseLayer) {
        scope.baseLayer = baseLayer.get("title");
      }
      MapManager.storyMap.on("change:baselayer", () => {
        scope.baseLayer = MapManager.storyMap.get("baselayer").get("title");
      });

      scope.toggleStyle = layer => {
        scope.styleSvc.setCurrentLayer(layer);
        scope.styleActivated = scope.styleActivated !== true;
      };

      scope.layers = MapManager.storyMap.getStoryLayers().getArray();
      MapManager.storyMap.getStoryLayers().on("change:length", () => {
        scope.layers = MapManager.storyMap.getStoryLayers().getArray();
      });
      scope.toggleVisibleLayer = layerSvc.toggleVisibleLayer;
      scope.removeLayer = layerSvc.removeLayer;

      scope.modifyLayer = lyr => {
        scope.swapping = true;
        stEditableStoryMapBuilder.modifyStoryLayer(lyr).then(() => {
          scope.swapping = false;
        });
      };
      scope.onChange = baseLayer => {
        stStoryMapBaseBuilder.setBaseLayer(MapManager.storyMap, baseLayer);
      };
      scope.onSort = (item, partFrom, partTo, indexFrom, indexTo) => {
        stateSvc.reorderLayer(indexFrom, indexTo);

        partFrom.forEach(layer => {
          console.log(layer.get("title"));
        });

        partTo.forEach(layer => {
          console.log(layer.get("title"));
        });
      };
    }
  };
}

module.exports = layerList;
