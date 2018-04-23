describe("mapManager", () => {
  let MapManager;
  let stateSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, $location, $q, _MapManager_, _stateSvc_) => {
      stateSvc = _stateSvc_;
      MapManager = _MapManager_;
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
