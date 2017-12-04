function searchSvc(
  $q,
  $rootScope,
  $http,
  appConfig,
  searchConfig,
  limitToFilter
) {
  var svc = {};

  svc.queries = {
    content: true,
    is_published: true,
    limit: searchConfig.CLIENT_RESULTS_LIMIT,
    offset: 0
  };

  svc.getSearchBarResultsIndex = function(layer_name) {
    var layerId;
    var url =
      appConfig.servers[0].host +
      "/api/base/search/?type__in=layer&limit=15&df=typename&q=" +
      layer_name;
    return $http.get(url).then(function(response) {
      var nameIndex = [];
      for (var i = 0; i < response.data.objects.length; i++) {
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

  svc.getCategories = function() {
    var defer = $q.defer();
    var params = typeof FILTER_TYPE == "undefined" ? {} : { type: FILTER_TYPE };
    $http
      .get(searchConfig.CATEGORIES_ENDPOINT, {
        params: params
      })
      .then(
        function(response) {
          defer.resolve(response.data.objects);
        },
        function(error) {
          defer.resolve("error");
        }
      );
    return defer.promise;
  };

  svc.search = function(queries) {
    var defer = $q.defer();
    var params = jQuery.extend(svc.queries, queries);

    $http.get(searchConfig.SEARCH_URL, { params: params || {} }).then(
      function(response) {
        defer.resolve(response.data);
        //page.paginate(response, vm, $scope);
      },
      function(error) {
        if (error.data.error_message === "Sorry, no results on that page.") {
          //console.log("Setting offset to 0 and searching again.");
          //queryService.resetOffset($scope);
          defer.resolve("noresults");
        } else {
          console.log(error);
          defer.resolve("error");
        }
      }
    );
    return defer.promise;
  };

  return svc;
}

module.exports = searchSvc;
