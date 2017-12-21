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
  navigationSvc,
  pinSvc,
  uiHelperSvc,
  searchSvc,
  stateSvc,
  // popupSvc,
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

  $scope.isDefault = function($event, index) {
    var elem = document.querySelectorAll('.isDefault')

    for (var i = 0; i < elem.length; i++) {
        elem[i].classList.remove('isDefault');
    }

    $event.currentTarget.classList.add('isDefault');
  };

  $scope.frameSettings = [];

  $scope.clearLayers = function() {
      $log.log('clear layers');
      MapManager.storyMap.getMap().getLayers().forEach(function (layer) {
          if(layer instanceof ol.layer.Vector) {
              MapManager.storyMap.getMap().removeLayer(layer);
          }
      });
  };

  $scope.drawBoundingBox = function() {
      var bbVector = new ol.source.Vector({wrapX: false});
      var vector = new ol.layer.Vector({
          source: bbVector
      });
      bbVector.on('addfeature', function(evt){
          var feature = evt.feature;
          $scope.coords = feature.getGeometry().getCoordinates();
      });
      var geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
      var draw = new ol.interaction.Draw({
        source: bbVector,
        type: 'Circle',
        geometryFunction: geometryFunction
      });
      vector.set('name', 'boundingBox');
      MapManager.storyMap.getMap().addLayer(vector);
      MapManager.storyMap.getMap().addInteraction(draw);
  };

  $scope.storyDetails = function(frameSettings) {
    frameSettings.id = Date.now();

    $scope.frameSettings.push({
        id: frameSettings.id,
        title: frameSettings.title,
        startDate: frameSettings.startDate,
        startTime: frameSettings.startTime,
        endDate: frameSettings.endDate,
        endTime: frameSettings.endTime,
        radius: frameSettings.radius,
        bb1: ol.proj.transform([$scope.coords[0][0][0], $scope.coords[0][0][1]], 'EPSG:3857', 'EPSG:4326'),
        bb2: ol.proj.transform([$scope.coords[0][1][0], $scope.coords[0][1][1]], 'EPSG:3857', 'EPSG:4326'),
        bb3: ol.proj.transform([$scope.coords[0][2][0], $scope.coords[0][2][1]], 'EPSG:3857', 'EPSG:4326'),
        bb4: ol.proj.transform([$scope.coords[0][3][0], $scope.coords[0][3][1]], 'EPSG:3857', 'EPSG:4326')
      });
  };

  $scope.editStoryframe = function(index) {
    $scope.frameSettings.title = $scope.frameSettings[index].title;
    $scope.frameSettings.startDate = $scope.frameSettings[index].startDate;
    $scope.frameSettings.startTime = $scope.frameSettings[index].startTime;
    $scope.frameSettings.endDate = $scope.frameSettings[index].endDate;
    $scope.frameSettings.endTime = $scope.frameSettings[index].endTime;
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
      $scope.frameSettings[$scope.currentIndex].radius = $scope.frameSettings.radius;
      $scope.disableButton = true;
      $scope.disableButton = !$scope.disableButton;
  }

  $scope.deleteStoryframe = function(index) {
    $scope.frameSettings.splice(index, 1);
  };
}

module.exports = composerController;
