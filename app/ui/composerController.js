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

  MapManager.storyMap.getMap().on("singleclick", function(evt) {
    $log.log("MAP CLICKED !!!", evt);
  });

  $scope.updateSelected = function(selected) {
    $scope.selected = { selected: true };
  };

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

  $scope.nextChapter = navigationSvc.nextChapter;
  $scope.previousChapter = navigationSvc.previousChapter;

  var storyframeList = [];

  $scope.frameSettings = [
      {'title': 'Default Story'},
  ]

  $scope.storyDetails = function(frameSettings) {
      frameSettings.id = Date.now();

      frameSettings.push({
              id: frameSettings.id,
              title: frameSettings.title,
              startDate: frameSettings.startDate,
              startTime: frameSettings.startTime,
              endDate: frameSettings.endDate,
              endTime: frameSettings.endTime
      });
      $log.log(storyframeList);
  };

  $scope.deleteStoryframe = function(frameTitle) {
    $log.log('delete: ', frameTitle);
  };

  $scope.editStoryframe = function(frameTitle) {
    $log.log('updated: ', frameTitle);
  };

}

module.exports = composerController;
