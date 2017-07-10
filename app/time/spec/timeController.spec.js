describe('timeController', function() {
  var scope, rootScope, createController;
  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $controller) {
      rootScope = $rootScope;
      scope = $rootScope.$new();
      createController = function() {
          return $controller('timeController', {
              '$scope': scope
          });
      };
  }));
});
