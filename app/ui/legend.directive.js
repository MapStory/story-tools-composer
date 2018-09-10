import PubSub from "pubsub-js";

function legendDirective(layerSvc) {
  let legendOpen = false;

  return {
    restrict: "E",
    templateUrl: "./app/ui/templates/legend.html",
    link: scope => {
      scope.layers = {
        list: []
      };

      const openLegend = () => {
        angular.element("#legend-container")[0].style.visibility = "visible";
        angular.element("#legend-panel").collapse("show");
        legendOpen = true;
      };

      const closeLegend = () => {
        angular.element("#legend-panel").collapse("hide");
        legendOpen = false;

        // the timeout is so the transition will finish before hiding the div
        setTimeout(() => {
          angular.element("#legend-container")[0].style.visibility = "hidden";
        }, 350);
      };

      scope.toggleLegend = () => {
        if (legendOpen === false && scope.layers.list.length > 0) {
          openLegend();
        } else {
          closeLegend();
        }
      };

      const updateLayers = () => {
        scope.$apply(() => {
          scope.layers.list = scope.mapManager.storyMap.getStoryLayers().getArray();
          scope.layers.list.forEach(layer => {
            layer.set("legendURL", layerSvc.getLegendUrl(layer));
          });
        });
      };

      PubSub.subscribe("layerUpdated", () => {
        updateLayers();
      });

      PubSub.subscribe("layerAdded", () => {
        if (legendOpen === false) {
          openLegend();
        }
        updateLayers();
      });

      PubSub.subscribe("layerRemoved", () => {
        // close the legend if the last layer is removed
        if (legendOpen === true && scope.layers.list.length === 1) {
          closeLegend();
        }
        updateLayers();
      });
    }
  };
}

export default legendDirective;
