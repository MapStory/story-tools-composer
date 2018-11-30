function addLayers(layerSvc, stateSvc) {
  return {
    restrict: "E",
    scope: {
      map: "="
    },
    templateUrl: "./app/layers/templates/add-layers.html",
    link: scope => {
      let searchObjects;

      scope.getResults = (searchValue) =>
        layerSvc.getSearchBarResultsIndex(searchValue).then(data => {
          searchObjects = data;
          let searchLayerArray = [];
          let configLayerArray = [];
          const searchLayers = layerSvc.compileLayerTitlesFromSearchIndex(data);
          const configLayers = stateSvc.config.chapters[stateSvc.getChapterIndex()].layers;

          for (const configLayer in configLayers) {
            configLayerArray.push(configLayers[configLayer].title);
          }
          for (const searchTitle in searchLayers) {
            searchLayerArray.push(searchLayers[searchTitle]);
          }
          for (const layer in configLayerArray) {
            searchLayerArray = searchLayerArray.filter(item => item !== configLayerArray[layer]);
          }
          if(searchLayerArray.length < 1) {
            const errorDiv = document.getElementById("noResults");
            errorDiv.innerHTML = "<i class='glyphicon glyphicon-exclamation-sign'> </i> You have added all available layers.";
          } else {
            return searchLayerArray;
          }
        });

      scope.addLayerFromSearchResults = (layerName) => {
        const errorDiv = document.getElementById("noResults");
        const errorMsg = "<i class='glyphicon glyphicon-remove'> </i> No matching layers found.";

        if (searchObjects !== undefined && searchObjects.length !== 0) {
          for (let x = 0; x < searchObjects.length; x++) {
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
