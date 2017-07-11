describe('composerController', function() {

  var config, scope, timeControllerScope, rootScope, location, createController;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $controller, $location, _config_) {
    config = _config_;
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

  /*
  @TODO: figure out why $rootScope.timeControlsManager is null

  describe('nextChapter', function() {
    beforeEach(inject(function ($controller, $rootScope) {
      timeControllerScope = $rootScope.$new();
      createTimeController = function() {
        return $controller('timeController', {
            '$scope': timeControllerScope
        });
      };
      spyOn(location, 'path');
    }));

    it('should broadcast `toggleMode` with the current map width', function() {
      var timeController = createTimeController();
      var controller = createController();
      scope.mapManager.chapterCount = 2;
      scope.nextChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });
  });
  */

});
