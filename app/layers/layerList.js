import stateSvc from "app/state/stateSvc";

function layerList(
  stStoryMapBaseBuilder,
  stEditableStoryMapBuilder,
  MapManager,
  layerSvc,
  styleService
) {
  return {
    restrict: "E",
    scope: {
      map: "=",
      selected: "@"
    },
    templateUrl: "./app/layers/templates/layer-list.html",
    link: scope => {
      scope.baseLayers = layerSvc.baseLayers;
      scope.styleSvc = styleService;
      scope.styleActivated = false;
      scope.stateSvc = stateSvc;
      const baseLayer = MapManager.storyMap.get("baselayer");
      if (baseLayer) {
        scope.baseLayer = baseLayer.get("title");
      }
      MapManager.storyMap.on("change:baselayer", () => {
        scope.baseLayer = MapManager.storyMap.get("baselayer").get("title");
      });

      scope.styleChanged = layer => {
        layer.on("change:type", evt => {
          styleService.updateStyle(evt.target);
        });
        styleService.updateStyle(layer);
      };

      scope.toggleStyle = layer => {
        // If layer is not defined, we do not need to change the current layer
        if (layer) {
          scope.styleSvc.setCurrentLayer(layer).then(() => {
            scope.styleActivated = scope.styleActivated !== true;
          });
        } else {
          scope.styleActivated = scope.styleActivated !== true;
        }
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
      scope.onChange = newBaseLayer => {
        stStoryMapBaseBuilder.setBaseLayer(MapManager.storyMap, newBaseLayer);
        stateSvc.updateBaseLayer(newBaseLayer);
      };
      scope.onSort = (item, partFrom, partTo, indexFrom, indexTo) => {
        stateSvc.reorderLayer(indexFrom, indexTo);
      };
    }
  };
}

export default layerList;
