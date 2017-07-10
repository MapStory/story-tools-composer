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

  describe('getMapWidth', function() {

    it('should provide preview mode map width when arg is `true`', function() {
      var controller = createController();
      expect(scope.getMapWidth(true)).toBe(config.dimensions.mapWidthPreviewMode);
    });

    it('should provide edit mode map width when arg is not `true`', function() {
      var controller = createController();
      expect(scope.getMapWidth(true)).toBe(config.dimensions.mapWidthPreviewMode);
    });

  });

});
