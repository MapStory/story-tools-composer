function legendDirective(layerSvc, MapManager) {
  return {
    restrict: "E",
    templateUrl: "./app/ui/templates/legend.html",
    link: (scope, element, attrs) => {
      scope.$on("layer-ready", (ev, layer) => {
        scope.legend_url = layerSvc.get_legend_url(layer);
        // TODO: Fix this
        // // Make an overlay.
        // const overlay = new ol.Overlay({
        //   element: document.getElementById("legend"),
        //   // positioning: "bottom-center"
        // });
        //
        // const map = MapManager.storyMap.getMap();
        // map.addOverlay(overlay);
      });
    }
  };
}

module.exports = legendDirective;
