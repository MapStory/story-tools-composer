describe('composerController', function() {

  var config, scope, rootScope, createController;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $controller, _config_) {
    config = _config_;
    rootScope = $rootScope;
    scope = $rootScope.$new();
    createController = function() {
      return $controller('composerController', {
          '$scope': scope
      });
    };
  }));

  it('should toggle map width ', function() {
    var controller = createController();
    expect(scope.mapWidth).toBe(config.dimensions.mapWidthEditMode);
  });

});
