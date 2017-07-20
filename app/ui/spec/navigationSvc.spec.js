describe('navigationSvc', function() {

  var rootScope, config, MapManager, navigationSvc, location, stateSvc;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $location, _navigationSvc_,
                              _stateSvc_, _appConfig_) {
    config = _appConfig_;
    navigationSvc = _navigationSvc_;
    stateSvc = _stateSvc_;
    rootScope = $rootScope;
    location = $location;
  }));

  describe('nextChapter', function() {
    beforeEach(inject(function ($controller, $rootScope, $compile) {
      spyOn(location, 'path');
    }));

    it('should update the location path to the next chapter if it exists', function() {
      stateSvc.setConfig({chapters:[{},{}]});
      navigationSvc.nextChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no next chapter ', function() {
      stateSvc.setConfig({chapters:[{}]});
      navigationSvc.nextChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });

  describe('previous chapter', function() {
    beforeEach(inject(function ($rootScope, $compile) {
    }));

    it('should update the location path to the previous chapter if it exists', function() {
      stateSvc.setConfig({chapters:[{},{},{}]});
      spyOn(location, 'path').and.returnValue('/chapter/3');
      navigationSvc.previousChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no previous chapter ', function() {
      stateSvc.setConfig({chapters:[{}]});
      spyOn(location, 'path');
      navigationSvc.previousChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });
});
