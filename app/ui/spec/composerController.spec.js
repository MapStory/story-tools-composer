describe('composerController', function() {

  var config, scope, element,
      rootScope, location, createController;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $controller, $location, _appConfig_) {
    config = _appConfig_;
    rootScope = $rootScope;
    location = $location;
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

  describe('togglePreviewMode', function() {
    beforeEach(function() {
      spyOn(rootScope, '$broadcast');
    });

    it('should broadcast `toggleMode` with the current map width', function() {
      var controller = createController();
      scope.togglePreviewMode();
      expect(rootScope.$broadcast).toHaveBeenCalledWith('toggleMode', { mapWidth: config.dimensions.mapWidthEditMode });
    });
  });

  describe('nextChapter', function() {
    beforeEach(inject(function ($controller, $rootScope, $compile) {
      spyOn(location, 'path');
    }));

    it('should update the location path to the next chapter if it exists', function() {
      var controller = createController();
      scope.mapManager.chapterCount = 2;
      scope.nextChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no next chapter ', function() {
      var controller = createController();
      scope.mapManager.chapterCount = 1;
      scope.nextChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });

  describe('previous chapter', function() {
    beforeEach(inject(function ($controller, $rootScope, $compile) {
      spyOn(location, 'path');
    }));

    it('should update the location path to the previous chapter if it exists', function() {
      var controller = createController();
      scope.mapManager.storyChapter = 3;
      scope.mapManager.chapterCount = 3;
      scope.previousChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no previous chapter ', function() {
      var controller = createController();
      scope.mapManager.chapterCount = 1;
      scope.previousChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });

});
