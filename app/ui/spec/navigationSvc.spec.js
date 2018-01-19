describe('navigationSvc', () => {

  let rootScope, config, MapManager, navigationSvc, location, stateSvc;

  beforeEach(module('composer'));
  beforeEach(inject(($rootScope, $location, _navigationSvc_, _stateSvc_, _appConfig_) => {
    config = _appConfig_;
    navigationSvc = _navigationSvc_;
    stateSvc = _stateSvc_;
    rootScope = $rootScope;
    location = $location;
  }));

  describe('nextChapter', () => {
    beforeEach(inject(($controller, $rootScope, $compile) => {
      spyOn(location, 'path');
    }));

    it('should update the location path to the next chapter if it exists', () => {
      stateSvc.setConfig({chapters:[{},{}]});
      navigationSvc.nextChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no next chapter ', () => {
      stateSvc.setConfig({chapters:[{}]});
      navigationSvc.nextChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });

  describe('previous chapter', () => {
    beforeEach(inject(($rootScope, $compile) => {
    }));

    it('should update the location path to the previous chapter if it exists', () => {
      stateSvc.setConfig({chapters:[{},{},{}]});
      spyOn(location, 'path').and.returnValue('/chapter/3');
      navigationSvc.previousChapter();
      expect(location.path).toHaveBeenCalledWith(config.routes.chapter + 2);
    });

    it('should update the location path to the first chapter if there is no previous chapter ', () => {
      stateSvc.setConfig({chapters:[{}]});
      spyOn(location, 'path');
      navigationSvc.previousChapter();
      expect(location.path).toHaveBeenCalledWith('');
    });
  });
});
