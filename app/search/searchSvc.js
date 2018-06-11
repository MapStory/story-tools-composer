function searchSvc($q, $rootScope, $http, appConfig, searchConfig) {
  const svc = {};

  svc.queries = {
    content: true,
    isPublished: true,
    limit: searchConfig.CLIENT_RESULTS_LIMIT,
    offset: 0
  };

  svc.getSearchBarResultsIndex = layerName => {
    const url = `${
      appConfig.servers[0].host
    }/api/base/search/?type__in=layer&limit=15&df=typename&q=${layerName}`;
    return new Promise(resolve => {
      $http.get(url).then(response => {
        const nameIndex = [];
        const objects = response.data.objects;

        for (let i = 0; i < objects.length; i += 1) {
          if (objects[i].alternate) {
            nameIndex.push({
              title: objects[i].title,
              typename: objects[i].alternate.split("geonode:")[1]
            });
          }
        }
        resolve(nameIndex);
      });
    });
  };

  return svc;
}

export default searchSvc;
