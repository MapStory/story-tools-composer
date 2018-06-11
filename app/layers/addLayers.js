function addLayers(
  $log,
  $http,
  $sce,
  limitToFilter,
  MapManager,
  searchSvc,
  layerSvc,
  appConfig
) {
  return {
    restrict: "E",
    scope: {
      map: "="
    },
    templateUrl: "./app/layers/templates/add-layers.html",
    link: scope => {
      let nameIndex;
      let names;
      scope.server = {
        active: appConfig.servers[0]
      };
      scope.servers = appConfig.servers;
      scope.getResults = layerName => {
        return searchSvc.getSearchBarResultsIndex(layerName).then(res => {
          nameIndex = res;
          names = layerSvc.compileLayerNamesFromSearchIndex(res);
          return names;
        });
      };
      scope.addLayer = () => {
        scope.loading = true;
        const name = layerSvc.getNameFromIndex(scope.layerName, nameIndex);
        const settings = {
          asVector: scope.asVector,
          allowZoom: scope.allowZoom,
          allowPan: scope.allowPan
        };
        MapManager.addLayer(name, settings, scope.server.active)
          .then(() => {
            scope.$parent.status.open = false;
          })
          .finally(() => {
            scope.loading = false;
          });
        scope.layerName = null;
      };
    }
  };
}

export default addLayers;
