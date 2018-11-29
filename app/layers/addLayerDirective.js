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
          let titles = [];
          searchObjects = data;
          let searchLayerArray = [];
          let configLayerArray = [];
          let searchLayers = layerSvc.compileLayerTitlesFromSearchIndex(data);
          let configLayers = stateSvc.config.chapters[stateSvc.getChapterIndex()].map.layers;

          for (let i in configLayers) {
            configLayerArray.push(configLayers[i].title);
          }
          for (let title in searchLayers) {
            searchLayerArray.push(searchLayers[title]);
          }
          for (let layer in configLayerArray) {
            titles = searchLayerArray.filter(item => item !== configLayerArray[layer]);
          }
          console.log(titles.length);
          return titles;
        });


      scope.addLayerFromSearchResults = (layerName) => {
        const errorDiv = document.getElementById("noResults");
        const errorMsg = "<i class='glyphicon glyphicon-remove'></i> No matching layers found.";

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
