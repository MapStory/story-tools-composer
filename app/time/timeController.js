function timeController ($scope, $rootScope, $injector, TimeControlsManager) {
  $rootScope.timeControlsManager = $injector.instantiate(TimeControlsManager);
  $scope.timeControlsManager = $rootScope.timeControlsManager;
}

module.exports = timeController;
