function timeController ($scope, $rootScope, $injector, TimeControlsManager) {
  $scope.timeControlsManager = $injector.instantiate(TimeControlsManager);
  $scope.mapWidth = $rootScope.mapWidth;

  $rootScope.$on('toggleMode', function(o, data) {
    $scope.mapWidth = data.mapWidth;
  });

  $rootScope.$on('updateTimeValues', function(o, data) {
    $scope.timeControlsManager.timeControls.update(data);
  });

}

module.exports = timeController;
