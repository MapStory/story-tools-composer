/**
 * Allows the user to switch between different latitude and longitude representations.
 */

function latlonInputController($scope, pinSvc, MapManager) {
  const map = MapManager.storyMap.getMap();
  const dmsRegex = /(\d*)° (\d*)′ (\d*)″ ([N,S]) (\d*)° (\d*)′ (\d*)″ ([E,W])/;
  const decimalResolution = 4;

  $scope.pinSvc = pinSvc;
  $scope.displayCoordinates = pinSvc.displayCoordinates;
  $scope.dms = {
    lat: {},
    lon: {}
  };

  $scope.convertToHumanReadable = () => {
    if (!$scope.pin) return;
    const currentPin = $scope.pin.length ? $scope.pin[0] : $scope.pin;
    if (!$scope.pin.coords) return;
    const realCoords = ol.proj.transform(
      currentPin.coords,
      map.getView().getProjection(),
      "EPSG:4326"
    );
    realCoords[0] = +realCoords[0].toFixed(decimalResolution);
    realCoords[1] = +realCoords[1].toFixed(decimalResolution);
    const dmsString = ol.coordinate.toStringHDMS(realCoords);

    if (dmsRegex.test(dmsString)) {
      const dms = dmsRegex.exec(dmsString);
      $scope.dms.lat.degrees = +dms[1];
      $scope.dms.lat.minutes = +dms[2];
      $scope.dms.lat.seconds = +dms[3];
      $scope.dms.lat.direction = dms[4];

      $scope.dms.lon.degrees = +dms[5];
      $scope.dms.lon.minutes = +dms[6];
      $scope.dms.lon.seconds = +dms[7];
      $scope.dms.lon.direction = dms[8];

      $scope.humanCoords = realCoords;
    }
  };

  $scope.convertToMapModelReadable = () => {
    if ($scope.humanCoords[0] !== undefined && $scope.humanCoords[1] !== undefined) {
      const mapCoords = ol.proj.transform($scope.humanCoords, "EPSG:4326", map.getView().getProjection());
      $scope.pin.coords = [+mapCoords[0].toFixed(decimalResolution), +mapCoords[1].toFixed(decimalResolution)];
    }
  };

  const isValidDMS = (dms) => {
    const lat = dms.lat;
    const lon = dms.lon;
    if (lat.degrees === undefined || lat.degrees < 0 || lat.degrees > 90) {
      return false;
    }
    if (lat.minutes === undefined || lat.minutes < 0 || lat.minutes > 60) {
      return false;
    }
    if (lat.seconds === undefined || lat.seconds < 0 || lat.seconds > 60) {
      return false;
    }
    if (lon.degrees === undefined || lon.degrees < 0 || lon.degrees > 180) {
      return false;
    }
    if (lon.minutes === undefined || lon.minutes < 0 || lon.minutes > 60) {
      return false;
    }
    if (lon.seconds === undefined || lon.seconds < 0 || lon.seconds > 60) {
      return false;
    }
    return true;
  };

  $scope.convertDMSToDecimal = () => {
    if (isValidDMS($scope.dms)) {
      let lat = $scope.dms.lat.degrees;
      lat += $scope.dms.lat.minutes / 60;
      lat += $scope.dms.lat.seconds / 60 / 60;
      lat = +lat.toFixed(decimalResolution);
      if ($scope.dms.lat.direction === "S") {
        lat *= -1;
      }

      let lon = $scope.dms.lon.degrees;
      lon += $scope.dms.lon.minutes / 60;
      lon += $scope.dms.lon.seconds / 60 / 60;
      lon = +lon.toFixed(decimalResolution);
      if ($scope.dms.lon.direction === "W") {
        lon *= -1;
      }

      $scope.humanCoords[0] = lon;
      $scope.humanCoords[1] = lat;
      $scope.convertToMapModelReadable();
    }

  };

  $scope.$watch("pin.coords", $scope.convertToHumanReadable, true);
}

module.exports = latlonInputController;
