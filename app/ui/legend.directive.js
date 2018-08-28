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
        if (legendOpen === false) {
          if (angular.element(".legend-item").length > 0) {
            openLegend();
          }
        } else {
          closeLegend();
        }
      };

      scope.getLegendUrl = layerSvc.getLegendUrl;

      PubSub.subscribe("layerAdded", () => {
        if (legendOpen === false) {
          openLegend();
          scope.$apply(() => {
            scope.layers.list = scope.mapManager.storyMap.getStoryLayers().getArray();
          });
        }
      });

      PubSub.subscribe("layerRemoved", () => {
        // close the legend if the last layer is removed
        if (
          legendOpen === true &&
          angular.element(".legend-item").length === 1
        ) {
          closeLegend();
        }
        scope.$apply(() => {
          scope.layers.list = scope.mapManager.storyMap.getStoryLayers().getArray();
        });
      });
    }
  };
}

export default legendDirective;
