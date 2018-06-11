describe("searchSvc", () => {
  let appConfig;
  let httpBackend;
  let searchConfig;
  let searchBarRes;
  let searchSvc;
  let categoryRes;

  beforeEach(module("composer"));
  beforeEach(
    inject(($httpBackend, _appConfig_, _searchSvc_, _searchConfig_) => {
      searchSvc = _searchSvc_;
      searchConfig = _searchConfig_;
      appConfig = _appConfig_;
      httpBackend = $httpBackend;

      searchBarRes = {
        objects: [
          {
            title: "Green Iguana",
            alternate: "geonode:green_iguana"
          }
        ]
      };

      httpBackend
        .when("GET", searchConfig.CATEGORIES_ENDPOINT)
        .respond(categoryRes);
      httpBackend
        .when(
          "GET",
          `${
            appConfig.servers[0].host
          }/api/base/search/?type__in=layer&limit=15&df=typename&q=iguana`
        )
        .respond(searchBarRes);
    })
  );

  describe("getSearchBarResultsIndex", () => {
    let response;

    beforeEach(done => {
      searchSvc.getSearchBarResultsIndex("iguana").then(res => {
        response = res;
        done();
      });
      httpBackend.flush();
    });

    it("should return an array of objects containing layer 'title' and 'typename'", () => {
      expect(response).toEqual([
        {
          title: "Green Iguana",
          typename: "green_iguana"
        }
      ]);
    });
  });
});
