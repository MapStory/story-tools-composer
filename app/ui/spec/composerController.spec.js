describe("composerController", () => {
  let config, scope, element, rootScope, location, createController;

  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, $controller, $location, _appConfig_) => {
      config = _appConfig_;
      rootScope = $rootScope;
      location = $location;
      scope = $rootScope.$new();
      createController = () =>
        $controller("composerController", {
          $scope: scope
        });
    })
  );
});
