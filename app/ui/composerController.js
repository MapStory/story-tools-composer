const moment = require("moment");

function composerController(
  $scope,
  $rootScope,
  $log,
  $injector,
  $uibModal,
  MapManager,
  styleService,
  appConfig,
  TimeControlsManager,
  TimeMachine,
  navigationSvc,
  pinSvc,
  searchSvc,
  stateSvc,
  configSvc,
  $location
) {
  let lastSelectedTab = null;
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.pinSvc = pinSvc;
  $scope.searchSvc = searchSvc;
  $scope.navigationSvc = navigationSvc;
  $scope.pin = {};
  $scope.selected = {toc: true};
  $scope.viewerMode = $location.search().viewer;
  $scope.showForm = null;

  if (window.mapstory.composerMode === "False") {
    $scope.composerMode = false;
  } else {
    $scope.composerMode = true;
  }

  function getUrlParam(name) {
    const results = new RegExp(`[\\?&]${  name  }=([^&#]*)`).exec(window.location.href);
    return (results && results[1]) || undefined;
  }

  const layer = getUrlParam("layer");
  if (layer > "") {
    MapManager.addLayer(layer, {}, 0);
  }

  $rootScope.$on("$locationChangeSuccess", () => {
    const urlChapterId = $location.path().split("chapter/")[1];
    const chapterCount = stateSvc.getChapterCount();
    if (urlChapterId > chapterCount) {
      $scope.navigationSvc.goToChapter(1);
    }
    $scope.mapManager.initMapLoad();
    $scope.stateSvc.updateCurrentChapterConfig();
  });

  $rootScope.$on("configInitialized", () => {
    $scope.mapManager.initMapLoad();
  });

  $rootScope.$on("chapter-added", (event, config) => pinSvc.addChapter());

  $rootScope.$on("chapter-removed", (event, chapterIndex) =>
    pinSvc.removeChapter(chapterIndex)
  );

  $scope.setPreviewMode = () => {
    $scope.viewerMode = !$scope.viewerMode;
    $scope.adminViewerMode = !$scope.adminViewerMode;
    if ($scope.viewerMode) {
      $scope.updateSelected("toc", null, true);
    } else {
      $scope.updateSelected(lastSelectedTab);
    }
  };

  $scope.removeChapter = chapterId => {
    // @TODO: write tests
    const urlChapterId = parseInt($location.path().split("chapter/")[1], 10);
    const chapterCount = stateSvc.getChapterCount();
    if (urlChapterId.toString() === chapterId.toString()) {
      if (chapterCount >= urlChapterId) {
        navigationSvc.goToChapter(chapterCount - 1);
      } else {
        navigationSvc.goToChapter(urlChapterId);
      }
    }
    $scope.stateSvc.removeChapter(chapterId);
    $scope.mapManager.initMapLoad();
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

  $scope.saveMap = () => {
    pinSvc.onStoryPinSave();
    stateSvc.save();
  };

  $scope.publishMap = () => {
    stateSvc.publish();
    $scope.openPublishedModal();
  };

  $scope.goHome = () => { $location.href = "/"; }
  $scope.newMap = () => $location.path("/new");

  $scope.layerProperties = lyr => {
    const props = lyr.getProperties();
    const features = delete props.features;
    props.featureCount = (features || []).length;
    return props;
  };

  $scope.updateSelected = (selected, chapterId, dontCache) => {
    $scope.selected = {};
    if ((chapterId !== null) && (chapterId !== undefined)) {
      navigationSvc.goToChapter(chapterId);
    }
    $scope.selected[selected] = true;
    if (!dontCache) {
      lastSelectedTab = selected;
    }
  };

  $scope.nextChapter = navigationSvc.nextChapter;
  $scope.previousChapter = navigationSvc.previousChapter;

  $scope.openStoryModal = (size) => {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyInfoModal.html",
      size,
      scope: $scope
    });
    $scope.close = () => {
      uibmodalInstance.dismiss("close");
    }
  };

  $scope.openPublishedModal = (size) => {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyPublished.html",
      size,
      scope: $scope
    });
    $scope.close = () => {
      uibmodalInstance.dismiss("close");
    }
  };

  /**
   * Updates the Storypins on timeline.
   * Loops the current chapter's StoryPins and determines if they should be shown or hidden.
   * @param date The date for the layer.
   */
  $scope.updateStorypinTimeline = date => {
    // TODO: Use pre-cooked timeframe objects to optimize this?
    let pinArray = pinSvc.pins[stateSvc.getChapterIndex()];
    // This should not be null. Why is this happening?
    if (!pinArray) {
      pinArray = [];
      pinSvc.pins[stateSvc.getChapterIndex()] = pinArray;
    }
    pinArray.forEach(pin => {
      const startDate = $scope.formatDates(pin.startTime);
      const endDate = $scope.formatDates(pin.endTime);
      const storyLayerStartDate = $scope.formatDates(date);

      let shouldShow = false;
      if (moment(storyLayerStartDate).isSameOrAfter(startDate)) {
        // TODO: Show StoryPin.
        shouldShow = true;
      }
      if (moment(storyLayerStartDate).isSameOrAfter(endDate)) {
        // TODO: Hide Storypin.
        shouldShow = false;
      }

      if (shouldShow) {
        pin.show();
      } else {
        pin.hide();
      }
    });
  };
}

module.exports = composerController;
