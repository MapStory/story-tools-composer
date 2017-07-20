describe('stateSvc', function() {

  var rootScope, location, stateSvc;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $location, _stateSvc_) {
    stateSvc = _stateSvc_;
    rootScope = $rootScope;
    location = $location;
  }));

  describe('getConfig', function() {
    it('should return a configuration object with a `chapters` attribute',
    function() {
      expect(stateSvc.getConfig().chapters[0].about.title).toBe('prisons');
    });
  });

  describe('getChapter', function() {
    it('should return the number of the current chapter (value: 1)', function() {
      expect(stateSvc.getChapter()).toBe(1);
    });

    it('should return the number of the current chapter (value: 2)', function() {
      spyOn(location, 'path').and.returnValue('/chapter/2');
      expect(stateSvc.getChapter()).toBe(2);
    });
  });

  describe('getChapterConfigs', function() {
    it('should return all chapter configs in an array', function() {
      expect(stateSvc.getChapterConfigs().length).toBe(2);
    });
  });

  describe('getChapterCount', function() {
    it('should return the number of chapters (value: 2)', function() {
      expect(stateSvc.getChapterCount()).toBe(2);
    });
  });

  describe('getChapterConfig', function() {
    it('should return the config of the first chapter', function() {
      expect(stateSvc.getChapterConfig().about.title).toBe('prisons');
    });
  });

  describe('getChapterConfig', function() {
    it('should return the config of the second chapter', function() {
      spyOn(location, 'path').and.returnValue('/chapter/2');
      expect(stateSvc.getChapterConfig().about.title).toBe('just testing');
    });
  });

  describe('setConfig', function() {
    it('should overwrite the existing config', function() {
      var testConfig = {'test': 'passs'};
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getConfig()).toBe(testConfig);
    });
  });
});
