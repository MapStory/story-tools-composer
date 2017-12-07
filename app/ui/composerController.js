function composerController(
  $scope,
  $rootScope,
  $log,
  $compile,
  $http,
  $injector,
  MapManager,
  styleUpdater,
  stFeatureInfoService,
  appConfig,
  TimeControlsManager,
  stateSvc,
  navigationSvc,
  pinSvc,
  uiHelperSvc,
  searchSvc,
  $location
) {

  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.pinSvc = pinSvc;
  $scope.uiHelperSvc = uiHelperSvc;
  $scope.searchSvc = searchSvc;
  $scope.pin = {};

  $rootScope.$on("$locationChangeSuccess", function() {
    $scope.mapManager.initMapLoad();
    $scope.stateSvc.updateCurrentChapterConfig();
  });

  $rootScope.$on("configInitialized", function() {
    $log.log("config --- > ", stateSvc.getConfig());
    $scope.mapManager.initMapLoad();
  });

  $rootScope.$on("pin-added", function(event, chapter_index) {
    $log.log($scope.pinSvc.getPins(0));
    //$scope.$apply();
  });

  $rootScope.$on("chapter-added", function(event, config) {
    pinSvc.addChapter();
  });

  $rootScope.$on("chapter-removed", function(event, chapter_index) {
    pinSvc.removeChapter(chapter_index);
  });

  $scope.mode = {
    preview: false
  };
  $scope.timeControlsManager = $injector.instantiate(TimeControlsManager);
  $scope.mapWidth = appConfig.dimensions.mapWidthEditMode;
  $scope.playbackOptions = {
    mode: "instant",
    fixed: false
  };

  $scope.saveMap = function() {
    $scope.console.log("STORY MAP LAYERS ---- > ", window.storyMap.getStoryLayers());

    stateSvc.save();
  };

  $scope.newMap = function() {
    $location.path("/new");
  };

  $scope.styleChanged = function(layer) {
    layer.on("change:type", function(evt) {
      styleUpdater.updateStyle(evt.target);
    });
    styleUpdater.updateStyle(layer);
  };

  $scope.showLoadMapDialog = function() {
    var promise = loadMapDialog.show();
    promise.then(function(result) {
      if (result.mapstoryMapId) {
        $location.path("/maps/" + result.mapstoryMapId + "/data/");
      } else if (result.localMapId) {
        $location.path("/local/" + result.localMapId);
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
    if ($scope.mode.preview) {
      $("[data-target='#playback-settings']").css("display", "inline-block");
    } else {
      $("[data-target='#playback-settings']").css("display", "none");
    }
    $rootScope.$broadcast("toggleMode", {
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

  $scope.updateSelected = function(selected) {
    $scope.selected = { selected: true };
  };

  $scope.nextChapter = navigationSvc.nextChapter;
  $scope.previousChapter = navigationSvc.previousChapter;





  $scope.frameSettings = [];

  MapManager.storyMap.getMap().on("singleclick", function(evt) {
    var storyCenter = new ol.geom.Point(
        [evt.coordinate[0], evt.coordinate[1]]
    );

    var storyFeature = new ol.Feature();
    storyFeature.setGeometry(storyCenter);

    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [storyFeature]
        })
    });

    MapManager.storyMap.getMap().addLayer(vectorLayer);

    $scope.location = ol.proj.transform([evt.coordinate[0], evt.coordinate[1]], 'EPSG:3857', 'EPSG:4326' );
  });



  $scope.setStoryRadius = function(radius) {
      var circle = new ol.geom.Circle(ol.proj.transform($scope.location, 'EPSG:4326', 'EPSG:3857'), radius * 100);
      var storyFeatureRadius = new ol.Feature(circle);
      storyFeatureRadius.setGeometry(circle);

      var radiusLayer = new ol.layer.Vector({
          source: new ol.source.Vector({
              features: [storyFeatureRadius],
              style: [
                  new ol.style.Style({
                      stroke: new ol.style.Stroke({
                          color: 'blue',
                          width: 3
                      }),
                      fill: new ol.style.Fill({
                          color: 'yellow'
                      })
                  })]
          })
      });

      MapManager.storyMap.getMap().addLayer(radiusLayer);
  };







  $scope.removeMapLayer = function(layer) {
    MapManager.storyMap.getMap().removeLayer(layer);
  }











  $scope.storyDetails = function(frameSettings) {
    frameSettings.id = Date.now();

    $scope.frameSettings.push({
        id: frameSettings.id,
        title: frameSettings.title,
        startDate: frameSettings.startDate,
        startTime: frameSettings.startTime,
        endDate: frameSettings.endDate,
        endTime: frameSettings.endTime,
        radius: frameSettings.radius
      });
  };

  $scope.editStoryframe = function(index) {
    $scope.frameSettings.title = $scope.frameSettings[index].title;
    $scope.frameSettings.startDate = $scope.frameSettings[index].startDate;
    $scope.frameSettings.startTime = $scope.frameSettings[index].startTime;
    $scope.frameSettings.endDate = $scope.frameSettings[index].endDate;
    $scope.frameSettings.endTime = $scope.frameSettings[index].endTime;
    //$scope.locationSettings[0].loc = $scope.locationSettings[index][0].loc;
    $scope.frameSettings.radius = $scope.frameSettings[index].radius;

    $scope.currentIndex = index;
    $scope.disableButton = false;
    $scope.disableButton = !$scope.disableButton;
  };

  $scope.updateStoryframeRecord = function() {
      $scope.frameSettings[$scope.currentIndex].title = $scope.frameSettings.title;
      $scope.frameSettings[$scope.currentIndex].startDate = $scope.frameSettings.startDate;
      $scope.frameSettings[$scope.currentIndex].startTime = $scope.frameSettings.startTime;
      $scope.frameSettings[$scope.currentIndex].endDate = $scope.frameSettings.endDate;
      $scope.frameSettings[$scope.currentIndex].endTime = $scope.frameSettings.endTime;
      //$scope.locationSettings[$scope.currentIndex][0].loc = $scope.locationSettings[0].loc
      $scope.frameSettings[$scope.currentIndex].radius = $scope.frameSettings.radius;

      $scope.disableButton = true;
      $scope.disableButton = !$scope.disableButton;
  }

  $scope.deleteStoryframe = function(index) {
    $scope.frameSettings.splice(index, 1);
  };
}

module.exports = composerController;
