describe("uiHelperSvc", () => {
  let rootScope, compile, uiHelperSvc, pinSvc;
  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, $compile, _pinSvc_, _uiHelperSvc_) => {
      pinSvc = _pinSvc_;
      pinSvc.pins = [[{}, {}]];
      uiHelperSvc = _uiHelperSvc_;
      rootScope = $rootScope;
      compile = $compile;
    })
  );
});
