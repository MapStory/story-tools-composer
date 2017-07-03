function timeController ($scope, $rootScope, $injector, TimeControlsManager) {
  $rootScope.timeControlsManager = $injector.instantiate(TimeControlsManager);
  $scope.timeControlsManager = $rootScope.timeControlsManager;
  $scope.mapWidth = $rootScope.mapWidth;
  $rootScope.$on('toggleMode', function(o, data) {
    $scope.mapWidth = data.mapWidth;
  });

}

module.exports = timeController;
