describe("layerOptionsSvc", () => {
  let layerOptionsSvc;
  let testServer;

  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, _layerOptionsSvc_) => {
      layerOptionsSvc = _layerOptionsSvc_;
      testServer = {
        path: "/testpath"
      };
    })
  );

  describe("getLayerOptions", () => {
    it("should return the correct server path", () => {
      const layerOptTest = layerOptionsSvc.getLayerOptions(
        "test_layer",
        {},
        testServer
      );
      expect(layerOptTest.path).toBe(testServer.path);
    });
  });

  describe("getLayerOptions", () => {
    it("should return the correct server path", () => {
      const layerOptTest = layerOptionsSvc.getLayerOptions(
        "test_layer",
        {},
        testServer
      );
      expect(layerOptTest.path).toBe(testServer.path);
    });
  });
});
