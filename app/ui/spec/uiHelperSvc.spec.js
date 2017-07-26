describe('uiHelperSvc', function() {

  var rootScope, compile, uiHelperSvc, pinSvc;



  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $compile, _pinSvc_, _uiHelperSvc_) {
    pinSvc = _pinSvc_;
    pinSvc.pins = [[{},{}]];
    uiHelperSvc = _uiHelperSvc_;
    rootScope = $rootScope;
    compile = $compile;
  }));

  describe('togglePinForm', function() {
    it('should have two pin-form elements', function() {
      rootScope.image = {};
      element = compile(pinSection)(rootScope);
      rootScope.$digest();
      uiHelperSvc.togglePinForm(0);
      console.log(element[0].querySelectorAll('.pin-form'));
      uiHelperSvc.togglePinForm(0);
      console.log(element[0].querySelectorAll('.pin-form'));
      expect(element[0].querySelectorAll('.pin-form')).toBe(true);
    });
  });
});
