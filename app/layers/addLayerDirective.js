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
        const remote = nameIndex[0].remote;
        const settings = {
          asVector: scope.asVector,
          allowZoom: scope.allowZoom,
          allowPan: scope.allowPan
        };
        const addLayer = server => {
          MapManager.addLayer({
            name,
            settings,
            server: server || scope.server.active
          })
            .then(() => {
              scope.$parent.status.open = false;
            })
            .finally(() => {
              scope.loading = false;
            });
        };

        if (remote) {
          layerSvc.getRemoteServiceUrl(name).then(res => {
            const server = {
              absolutePath: res.url,
              canStyleWMS: false,
              name: "remote",
              type: "remote",
              path: ""
            };
            settings.params = res.params;
            addLayer(server);
          });
        } else {
          addLayer();
        }

        scope.layerName = null;
      };
    }
  };
}

export default addLayers;
