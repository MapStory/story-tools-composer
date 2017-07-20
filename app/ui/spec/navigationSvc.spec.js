describe('navigationSvc', function() {

  var rootScope, config, MapManager, navigationSvc, location, stateSvc;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $location, _navigationSvc_,
                              _MapManager_, _appConfig_) {
    config = _appConfig_;
    navigationSvc = _navigationSvc_;
    MapManager = _MapManager_;
    rootScope = $rootScope;
    location = $location;
  }));

  describe('nextChapter', function() {
    beforeEach(inject(function ($controller, $rootScope, $compile) {
      spyOn(location, 'path');
    }));

    it('should update the location path to the next chapter if it exists', function() {
      MapManager.chapterCount = 2;
      navigationSvc.nextChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no next chapter ', function() {
      MapManager.chapterCount = 1;
      navigationSvc.nextChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });

  describe('previous chapter', function() {
    beforeEach(inject(function ($rootScope, $compile) {
      spyOn(location, 'path');
    }));

    it('should update the location path to the previous chapter if it exists', function() {
      MapManager.storyChapter = 3;
      MapManager.chapterCount = 3;
      navigationSvc.previousChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no previous chapter ', function() {
      MapManager.chapterCount = 1;
      navigationSvc.previousChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });
});
