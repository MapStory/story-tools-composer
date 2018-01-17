describe('composerController', () => {

  let config, scope, element, rootScope, location, createController;

  beforeEach(module('composer'));
  beforeEach(inject(($rootScope, $controller, $location, _appConfig_) => {
    config = _appConfig_;
    rootScope = $rootScope;
    location = $location;
    scope = $rootScope.$new();
    createController = () => $controller('composerController', {
        '$scope': scope
    });
  }));

  describe('getMapWidth', () => {

    it('should provide preview mode map width when arg is `true`', () => {
      const controller = createController();
      expect(scope.getMapWidth(true)).toBe(config.dimensions.mapWidthPreviewMode);
    });

    it('should provide edit mode map width when arg is not `true`', () => {
      const controller = createController();
      expect(scope.getMapWidth(true)).toBe(config.dimensions.mapWidthPreviewMode);
    });
  });

  describe('togglePreviewMode', () => {
    beforeEach(() => {
      spyOn(rootScope, '$broadcast');
    });

    it('should broadcast `toggleMode` with the current map width', () => {
      const controller = createController();
      scope.togglePreviewMode();
      expect(rootScope.$broadcast).toHaveBeenCalledWith('toggleMode', { mapWidth: config.dimensions.mapWidthEditMode });
    });
  });

});
