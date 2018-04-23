describe("featureManagerSvc", () => {
  let featureManagerSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, $location, _featureManagerSvc_) => {
      featureManagerSvc = _featureManagerSvc_;
    })
  );

  describe("createVectorLayer", () => {
    it("should return a layer with metadata that has `vectorEditLayer` set to `true`", () => {
      const testLayer = featureManagerSvc.createVectorLayer();
      expect(testLayer.get("metadata").vectorEditLayer).toBe(true);
    });
  });
});
