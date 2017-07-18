describe('mapManager', function() {

  var rootScope, location, MapManager;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $location, _MapManager_) {
    MapManager = _MapManager_;
    rootScope = $rootScope.$new();
    location = $location;
  }));

});
