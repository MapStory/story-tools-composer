"use strict";

function addLayers(
  $log,
  $http,
  $sce,
  limitToFilter,
  MapManager,
  searchSvc,
  layerSvc,
  styleSvc,
  appConfig
) {
  return {
    restrict: "E",
    scope: {
      map: "="
    },
    templateUrl: "./app/layers/templates/add-layers.html",
    link: (scope, el) => {
      let nameIndex;
      let names;
      scope.server = {
        active: appConfig.servers[0]
      };
      scope.servers = appConfig.servers;
      scope.results = layerName =>
        searchSvc.getSearchBarResultsIndex(layerName).then(res => {
          nameIndex = res;
          names = layerSvc.compileLayerNamesFromSearchIndex(res);
          return limitToFilter(names, 15);
        });
      scope.addLayer = () => {
        scope.loading = true;
        const name = layerSvc.getNameFromIndex(scope.layerName, nameIndex);
        const settings = {
          asVector: scope.asVector,
          allowZoom: scope.allowZoom,
          allowPan: scope.allowPan
        };
        layerSvc.getLayerConfig(name).then(config => {
          const styleName = config.Layer[0].Style[0].Name;
          MapManager.addLayer(
            name,
            settings,
            scope.server.active,
            null,
            styleName
          )
            .then(() => {
              scope.$parent.status.open = false;
            }, layerSvc.handleAddLayerError)
            .finally(() => {
              scope.loading = false;
            });
          scope.layerName = null;
        });
      };
    }
  };
}

module.exports = addLayers;
