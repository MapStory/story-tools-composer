function composerController($scope, $rootScope, $log, $compile, $http, $injector,
                            MapManager, styleUpdater, appConfig, TimeControlsManager,
                            $location) {


    $scope.mapManager = MapManager;
    $scope.mode = {
      preview: false
    };
    $scope.timeControlsManager = $injector.instantiate(TimeControlsManager);
    $scope.mapWidth = appConfig.dimensions.mapWidthEditMode;
    $scope.playbackOptions = {
        mode: 'instant',
        fixed: false
    };

    $scope.saveMap = function() {
        MapManager.saveMap();
    };

    $scope.newMap = function() {
        $location.path('/new');
    };
    $scope.styleChanged = function(layer) {
        layer.on('change:type', function(evt) {
            styleUpdater.updateStyle(evt.target);
        });
        styleUpdater.updateStyle(layer);
    };
    $scope.showLoadMapDialog = function() {
        var promise = loadMapDialog.show();
        promise.then(function(result) {
            if (result.mapstoryMapId) {
                $location.path('/maps/' + result.mapstoryMapId + "/data/");
            } else if (result.localMapId) {
                $location.path('/local/' + result.localMapId);
            }
        });
    };

    $scope.getMapWidth = function(preview) {
      if (preview === true) {
        return appConfig.dimensions.mapWidthPreviewMode;
      } else {
        return appConfig.dimensions.mapWidthEditMode;
      }
    };

    $scope.togglePreviewMode = function() {
      $scope.mapWidth = $scope.getMapWidth($scope.mode.preview);
      $rootScope.mapWidth = $scope.mapWidth;
      $rootScope.$broadcast('toggleMode', {
        mapWidth: $scope.mapWidth
      });
      setTimeout(function() {
        window.storyMap.getMap().updateSize();
      });
    };

    // strip features from properties to avoid circular dependencies in debug
    $scope.layerProperties = function(lyr) {
        var props = lyr.getProperties();
        var features = delete props.features;
        props.featureCount = (features || []).length;
        return props;
    };


    var values = {annotations: [], boxes: [], data: []};

    $scope.nextChapter = function(){
        var nextChapter = Number($scope.mapManager.storyChapter) + 1;
        if(nextChapter <= $scope.mapManager.chapterCount) {
            $log.info("Going to Chapter ", nextChapter);
            $rootScope.$broadcast('updateTimeValues', values);
            $location.path(appConfig.routes.chapter + nextChapter);
        }else{
            $location.path('');
        }
    };

    $scope.previousChapter = function(){
        var previousChapter = Number($scope.mapManager.storyChapter) - 1;
        if (previousChapter > 0) {
            $log.info("Going to the Chapter ", previousChapter);
            $rootScope.$broadcast('updateTimeValues', values);
            $location.path(appConfig.routes.chapter + previousChapter);
        }else{
            $location.path('');
        }
    };
}

module.exports = composerController;
