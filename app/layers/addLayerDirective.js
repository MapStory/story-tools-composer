function addLayers(layerSvc) {
  return {
    restrict: "E",
    scope: {
      map: "="
    },
    templateUrl: "./app/layers/templates/add-layers.html",
    link: scope => {
      let searchObjects;
      let titles;

      scope.getResults = searchValue =>
        layerSvc.getSearchBarResultsIndex(searchValue).then(data => {
          searchObjects = data;
          titles = layerSvc.compileLayerTitlesFromSearchIndex(data);
          return titles;
        });

      scope.addLayerFromSearchResults = layerName => {
        layerSvc.addLayerFromApiResults({
          searchValue: scope.searchValue,
          searchObjects
        });
      };
    }
  };
}

export default addLayers;
