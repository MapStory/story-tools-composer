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

      scope.addLayerFromSearchResults = (layerName) => {
        const errorDiv = document.getElementById("noResults");
        const errorMsg = "<i class=\"glyphicon glyphicon-remove\"></i> No matching layers found.";

        if (searchObjects !== undefined && searchObjects.length !== 0) {
          for (let x=0; x<searchObjects.length; x++) {
            if (searchObjects[x].title === layerName) {
              errorDiv.innerHTML = "";
              layerSvc.addLayerFromApiResults({
                searchValue: scope.searchValue,
                searchObjects
              });
              break;
            } else if (searchObjects[x].title !== layerName) {
              errorDiv.innerHTML = errorMsg;
            }
          }
        } else {
          errorDiv.innerHTML = errorMsg;
        }
        document.getElementById("layerName").reset();
      }
    }
  }
};

export default addLayers;
