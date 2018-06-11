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
    return $http.get(url).then(response => {
      const nameIndex = [];
      for (let i = 0; i < response.data.objects.length; i += 1) {
        if (response.data.objects[i].alternate) {
          nameIndex.push({
            title: response.data.objects[i].title,
            typename: response.data.objects[i].alternate.split("geonode:")[1]
          });
        }
      }
      return nameIndex;
    });
  };

  return svc;
}

export default searchSvc;
