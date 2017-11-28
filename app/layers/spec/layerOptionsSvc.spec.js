describe("layerOptionsSvc", function() {
  var rootScope, layerOptionsSvc, testServer;

  beforeEach(module("composer"));
  beforeEach(
    inject(function($rootScope, _layerOptionsSvc_) {
      rootScope = $rootScope;
      layerOptionsSvc = _layerOptionsSvc_;
      testServer = {
        path: "/testpath"
      };
    })
  );

  describe("getLayerOptions", function() {
    it("should return valid layer options", function() {
      var layerOptTest = layerOptionsSvc.getLayerOptions(
        "test_layer",
        {},
        testServer
      );
      expect(layerOptTest.path).toBe(testServer.path);
    });
  });
});
