"use strict";

function tileProgressController($scope) {
  $scope.tilesToLoad = 0;
  $scope.tilesLoadedProgress = 0;
  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if (phase == "$apply" || phase == "$digest") {
      if (fn && typeof fn === "function") {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };
  $scope.$on("tilesLoaded", function(evt, remaining) {
    $scope.safeApply(function() {
      if (remaining <= 0) {
        $scope.tilesToLoad = 0;
        $scope.tilesLoaded = 0;
        $scope.tilesLoadedProgress = 0;
      } else {
        if (remaining < $scope.tilesToLoad) {
          $scope.tilesLoaded = $scope.tilesToLoad - remaining;
          $scope.tilesLoadedProgress = Math.floor(
            100 * ($scope.tilesLoaded / ($scope.tilesToLoad - 1))
          );
        } else {
          $scope.tilesToLoad = remaining;
        }
      }
    });
  });
}

module.exports = tileProgressController;
