angular.module("post").factory("Post", $resource => {
  let url = "/storypins/";
  return $resource(
    url,
    {},
    {
      query: {
        method: "GET",
        params: {},
        isArray: true,
        cache: false
        // transformResponse:
        // interceptor:
      },
      get: {}
    }
  );
});
