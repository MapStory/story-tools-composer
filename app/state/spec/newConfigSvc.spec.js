describe("newConfigSvc", function() {
  var rootScope, location, newConfigSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(function($rootScope, $location, _newConfigSvc_) {
      newConfigSvc = _newConfigSvc_;
      rootScope = $rootScope;
      location = $location;
    })
  );
});
