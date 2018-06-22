function addLayers(
  $log,
  $http,
  $sce,
  limitToFilter,
  MapManager,
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
      let titles;
      scope.server = {
        active: appConfig.servers[0]
      };
      scope.servers = appConfig.servers;

      // Get the results from Elastic Search to be used in the search bar based
      // on the user's search value
      scope.getResults = searchValue =>
        layerSvc.getSearchBarResultsIndex(searchValue).then(res => {
          nameIndex = res;
          titles = layerSvc.compileLayerTitlesFromSearchIndex(res);
          return titles;
        });

      scope.addLayer = () => {
        scope.loading = true;
        const name = layerSvc.getNameFromIndex(scope.searchValue, nameIndex);
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
        scope.searchValue = null;
      };
    }
  };
}

export default addLayers;
