function searchSvc($q, $rootScope, $http, searchConfig) {
  var svc = {};
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
  return svc;
}

module.exports = searchSvc;
