describe('featureManagerSvc', function() {

  var rootScope, location, featureManagerSvc;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $location, _featureManagerSvc_) {
    featureManagerSvc = _featureManagerSvc_;
    rootScope = $rootScope;
    location = $location;
  }));

});
