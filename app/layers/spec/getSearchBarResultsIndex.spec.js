describe("getSearchBarResultsIndex", () => {
  let appConfig;
  let httpBackend;
  let searchBarRes;

  beforeEach(module("composer"));
  beforeEach(
    inject(($httpBackend, _appConfig_) => {
      appConfig = _appConfig_;
      httpBackend = $httpBackend;

      searchBarRes = {
        objects: [
          {
            title: "Green Iguana",
            typename: "geonode:green_iguana",
            remote: false
          }
        ]
      };
      httpBackend
        .when(
          "GET",
          `${
            appConfig.servers[0].host
          }/api/layers/?title__contains=american=iguana`
        )
        .respond(searchBarRes);
      httpBackend.when("GET", "/api/categories/").respond([]);
    })
  );

  /*
  @TODO: figure out why this response is undefined
  describe("getSearchBarResultsIndex", () => {
    let response;

    beforeEach(done => {
      layerSvc.getSearchBarResultsIndex("iguana").then(res => {
        response = res;
        done();
      });
      httpBackend.flush();
    });

    it("should return an array of objects containing layer 'title' and 'typename'", () => {
      expect(response).toEqual([
        {
          title: "Green Iguana",
          typename: "geonode:green_iguana",
          remote: false
        }
      ]);
    });
  });
  */
});
