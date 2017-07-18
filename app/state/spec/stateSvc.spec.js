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
      expect(stateSvc.getConfig().chapters).not.toBeNull();
    });

    it('should return a promise', function() {
      expect(stateSvc.getConfig().then).toBeDefined();
    });
  });

  describe('getChapter', function() {
    it('should return 1', function() {
      expect(stateSvc.getChapter()).toBe(1);
    });

    it('should return 2', function() {
      spyOn(location, 'path').and.returnValue('/chapter/2');
      expect(stateSvc.getChapter()).toBe('2');
    });
  });
});
