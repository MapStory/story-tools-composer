describe("mapManager", () => {
  let rootScope, location, MapManager, $httpBackend, q, stateSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, $location, $q, _MapManager_, _stateSvc_, _$httpBackend_) => {
      q = $q;
      $httpBackend = _$httpBackend_;
      stateSvc = _stateSvc_;
      MapManager = _MapManager_;
      rootScope = $rootScope.$new();
      location = $location;
    })
  );

  describe("loadMap", () => {
    it("should call `loadMapFromID`", () => {
      const loadMapFromIDSpy = spyOn(
        MapManager,
        "loadMapFromID"
      ).and.callThrough();
      MapManager.loadMap(stateSvc.getChapterConfig());
      expect(loadMapFromIDSpy).toHaveBeenCalled();
    });
  });
});
