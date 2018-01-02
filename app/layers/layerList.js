function layerList(
  stStoryMapBaseBuilder,
  stEditableStoryMapBuilder,
  MapManager,
  layerSvc,
  styleSvc,
  stateSvc
) {
  return {
    restrict: "E",
    scope: {
      map: "=",
      selected: "@"
    },
    templateUrl: "./app/layers/templates/layer-list.html",
    link: function(scope, el, atts) {
      scope.baseLayers = layerSvc.baseLayers;
      scope.styleSvc = styleSvc;
      scope.styleActivated = false;
      var baseLayer = MapManager.storyMap.get("baselayer");
      if (baseLayer) {
        scope.baseLayer = baseLayer.get("title");
      }
      MapManager.storyMap.on("change:baselayer", function() {
        scope.baseLayer = MapManager.storyMap.get("baselayer").get("title");
      });

      scope.toggleStyle = function(layer) {
        scope.styleSvc.setCurrentLayer(layer);
        scope.styleActivated = scope.styleActivated ? false : true;
      };

      scope.layers = MapManager.storyMap.getStoryLayers().getArray();
      MapManager.storyMap.getStoryLayers().on("change:length", function() {
        scope.layers = MapManager.storyMap.getStoryLayers().getArray();
      });
      scope.toggleVisibleLayer = layerSvc.toggleVisibleLayer;
      scope.removeLayer = layerSvc.removeLayer;

      scope.modifyLayer = function(lyr) {
        scope.swapping = true;
        stEditableStoryMapBuilder.modifyStoryLayer(lyr).then(function() {
          scope.swapping = false;
        });
      };
      scope.onChange = function(baseLayer) {
        stStoryMapBaseBuilder.setBaseLayer(MapManager.storyMap, baseLayer);
      };
      scope.onSort = function(item, partFrom, partTo, indexFrom, indexTo) {
        stateSvc.reorderLayer(indexFrom, indexTo);

        partFrom.forEach(function(layer) {
          console.log(layer.get("title"));
        });

        partTo.forEach(function(layer) {
          console.log(layer.get("title"));
        });
      };
    }
  };
}

module.exports = layerList;
