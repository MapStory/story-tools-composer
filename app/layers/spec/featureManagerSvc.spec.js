describe('featureManagerSvc', function() {

  var rootScope, location, featureManagerSvc;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $location, _featureManagerSvc_) {
    featureManagerSvc = _featureManagerSvc_;
    rootScope = $rootScope;
    location = $location;
  }));

  describe('createVectorLayer', function() {
    it('should return a layer with metadata that has `vectorEditLayer` set to `true`', function() {
      var testLayer = featureManagerSvc.createVectorLayer();
      expect(testLayer.get('metadata').vectorEditLayer).toBe(true);
    });
  });

});
