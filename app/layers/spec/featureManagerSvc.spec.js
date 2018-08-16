describe("featureManagerSvc", () => {
  let svc;

  beforeEach(module("composer"));
  beforeEach(
    inject(_featureManagerSvc_ => {
      svc = _featureManagerSvc_;
    })
  );

  describe("createVectorLayer", () => {
    it("should return a layer with metadata that has `vectorEditLayer` set to `true`", () => {
      const testLayer = svc.createVectorLayer();
      expect(testLayer.get("metadata").vectorEditLayer).toBe(true);
    });
  });
});
