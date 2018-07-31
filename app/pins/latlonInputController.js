/**
 * Allows the user to switch between different latitude and longitude representations.
 */

function latlonInputController($scope, pinSvc, MapManager) {
  const map = MapManager.storyMap.getMap();
  $scope.pinSvc = pinSvc;
  $scope.displayCoordinates = pinSvc.displayCoordinates;

  $scope.$watch("displayCoordinates", (display) => {
    $scope.convertToHumanReadable();
  });

  $scope.convertToHumanReadable = () => {
    const realCoords = ol.proj.transform($scope.pin.coords, map.getView().getProjection(), "EPSG:4326");
    realCoords[0] = +realCoords[0].toFixed(4);
    realCoords[1] = +realCoords[1].toFixed(4);
    $scope.humanCoords = realCoords;
  };

  $scope.convertToMapModelReadable = () => {
    const mapCoords = ol.proj.transform($scope.humanCoords, "EPSG:4326", map.getView().getProjection());
    $scope.pin.coords = mapCoords;
  };

  $scope.$watch("humanCoords", $scope.convertToMapModelReadable, true);
  $scope.$watch("pin.coords", $scope.convertToHumanReadable, true);

}

module.exports = latlonInputController;
