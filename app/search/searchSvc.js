function searchSvc($q, $rootScope, $http, appConfig, searchConfig) {
  const svc = {};

  svc.queries = {
    content: true,
    is_published: true,
    limit: searchConfig.CLIENT_RESULTS_LIMIT,
    offset: 0
  };

  svc.getSearchBarResultsIndex = layer_name => {
    const url = `${
      appConfig.servers[0].host
    }/api/base/search/?type__in=layer&limit=15&df=typename&q=${layer_name}`;
    return $http.get(url).then(response => {
      const nameIndex = [];
      for (let i = 0; i < response.data.objects.length; i += 1) {
        if (response.data.objects[i].typename) {
          nameIndex.push({
            title: response.data.objects[i].title,
            typename: response.data.objects[i].typename
          });
        }
      }
      return nameIndex;
    });
  };

  return svc;
}

export default searchSvc;
