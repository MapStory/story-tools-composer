function searchSvc($q, $rootScope, $http, searchConfig) {
  var svc = {};

  svc.queries = {
    content: true,
    is_published: true,
    limit: searchConfig.CLIENT_RESULTS_LIMIT,
    offset: 0
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

  svc.search = function() {
    // we expose offset and limit for manipulation in the browser url,
    // validate them for error cases here (not needed when not exposed)
    // queryService.validateOffset($scope);
    // queryService.validateLimit($scope);

    return $http
      .get(searchConfig.SEARCH_URL, { params: svc.queries || {} })
      .then(
        function(response) {
          console.log(response.data.objects);
          //page.paginate(response, vm, $scope);
        },
        function(error) {
          if (error.data.error_message === "Sorry, no results on that page.") {
            console.log("Setting offset to 0 and searching again.");
            //queryService.resetOffset($scope);
          } else {
            console.log(error);
          }
        }
      );
  };

  return svc;
}

module.exports = searchSvc;
