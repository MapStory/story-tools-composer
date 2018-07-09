const moment = require("moment");

function composerController(
  $scope,
  $rootScope,
  $log,
  $injector,
  $uibModal,
  $window,
  $location,
  MapManager,
  styleService,
  appConfig,
  TimeControlsManager,
  TimeMachine,
  navigationSvc,
  pinSvc,
  frameSvc,
  stateSvc
) {
  let lastSelectedTab = null;
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.pinSvc = pinSvc;
  $scope.navigationSvc = navigationSvc;
  $scope.pin = {};
  $scope.selected = { toc: true };
  $scope.viewerMode = $location.search().viewer;
  $scope.showForm = null;
  $scope.frameSettings = [];

  const map = MapManager.storyMap.getMap();

  $scope.$watch(angular.bind($scope, () => {
    const fetchedFrameSettings = frameSvc.get("storyFrames");
    const currentChapter = stateSvc.getChapterIndex();

    if (fetchedFrameSettings && fetchedFrameSettings.length > 0) {
      if ($scope.frameSettings.length < fetchedFrameSettings.length) {
        fetchedFrameSettings.push({
          id: Date.now(),
          chapter: currentChapter,
          title: fetchedFrameSettings[1].title,
          startDate: fetchedFrameSettings[1].startDate,
          startTime: fetchedFrameSettings[1].startTime,
          endDate: fetchedFrameSettings[1].endDate,
          endTime: fetchedFrameSettings[1].endTime,
          bb1: [fetchedFrameSettings[1].bb1[0], fetchedFrameSettings[1].bb1[1]],
          bb2: [fetchedFrameSettings[1].bb2[0], fetchedFrameSettings[1].bb2[1]],
          bb3: [fetchedFrameSettings[1].bb3[0], fetchedFrameSettings[1].bb3[1]],
          bb4: [fetchedFrameSettings[1].bb4[0], fetchedFrameSettings[1].bb4[1]]
        });
      }
      $scope.frameSettings = fetchedFrameSettings;
    }
    return $scope.frameSettings;
  }));

  if (window.mapstory.composerMode === "False") {
    $scope.composerMode = false;
  } else {
    $scope.composerMode = true;
  }

  function getUrlParam(name) {
    const results = new RegExp(`[\\?&]${name}=([^&#]*)`).exec(
      window.location.href
    );
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

  $rootScope.$on("chapter-added", (event, config) => {
    pinSvc.addChapter();
  });

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

  $scope.goHome = () => {
    $window.location.href = "/";
  };
  $scope.newMap = () => $location.path("/new");

  $scope.layerProperties = lyr => {
    const props = lyr.getProperties();
    const features = delete props.features;
    props.featureCount = (features || []).length;
    return props;
  };

  $scope.updateSelected = (selected, chapterId, dontCache) => {
    $scope.selected = {};
    if (chapterId !== null && chapterId !== undefined) {
      navigationSvc.goToChapter(chapterId);
    }
    $scope.selected[selected] = true;
    if (!dontCache) {
      lastSelectedTab = selected;
    }
  };

  $scope.nextChapter = navigationSvc.nextChapter;
  $scope.previousChapter = navigationSvc.previousChapter;

  $scope.openStoryModal = size => {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyInfoModal.html",
      size,
      scope: $scope
    });
    $scope.close = () => {
      uibmodalInstance.dismiss("close");
    };
  };

  $scope.openPublishedModal = size => {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyPublished.html",
      size,
      scope: $scope
    });
    $scope.close = () => {
      uibmodalInstance.dismiss("close");
    };
  };

  $scope.formatDates = date => {
    const preFormatDate = moment(date);
    return preFormatDate.format("YYYY-MM-DD");
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

  /**
   * Callback for timeline update.
   * @param data Data from the timeline.
   */
  window.storypinCallback = data => {
    // Updates StoryPins.
    $scope.updateStorypinTimeline(data);
    // Updates StoryFrames
    $scope.getCurrentFrame(data);
  };

  $scope.currentFrame = 0;
  $scope.zoomedIn = false;

  $scope.getCurrentFrame = date => {
    if (date) {
      if ($scope.currentFrame < $scope.frameSettings.length) {
        const start = $scope.frameSettings[$scope.currentFrame].startDate;
        const end = $scope.frameSettings[$scope.currentFrame].endDate;
        $scope.checkTimes(date, start, end);
      }
      else if ($scope.currentFrame < $scope.frameSettings.length) {
        const start = new Date($scope.frameSettings[1].startDate * 1000);
        const end = new Date($scope.frameSettings[1].endDate * 1000);
        $scope.checkTimes(date, start, end);
      }
    }
  };

  $scope.checkTimes = (date, start, end) => {
    if (
      moment(date).isSameOrAfter(start) &&
      moment(date).isSameOrBefore(end) &&
      $scope.zoomedIn === false
    ) {
      $scope.zoomToExtent();
      $scope.zoomedIn = true;
    } else if (moment(date).isAfter(end)) {
      $scope.zoomOutExtent();
      $scope.zoomedIn = false;
    }
  };

  $scope.zoomToExtent = () => {
    let polygon;

    if ($scope.frameSettings[$scope.currentFrame].bb1) {
      polygon = new ol.Feature(
        new ol.geom.Polygon([
          [
            $scope.frameSettings[$scope.currentFrame].bb1,
            $scope.frameSettings[$scope.currentFrame].bb2,
            $scope.frameSettings[$scope.currentFrame].bb3,
            $scope.frameSettings[$scope.currentFrame].bb4
          ]
        ])
      )
    }
    else if (!$scope.frameSettings[$scope.currentFrame].bb1) {
      for (let i = 0; i < $scope.frameSettings.length; i += 1) {
        polygon = new ol.Feature(
          new ol.geom.Polygon([
            [
              $scope.frameSettings[i].bb1,
              $scope.frameSettings[i].bb2,
              $scope.frameSettings[i].bb3,
              $scope.frameSettings[i].bb4
            ]
          ])
        )
      }
    }
    const vector = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [polygon]
      })
    });
    map.addLayer(vector);
    map.beforeRender(
      ol.animation.pan({
        source: map.getView().getCenter(),
        duration: 1000
      }),
      ol.animation.zoom({
        resolution: map.getView().getResolution(),
        duration: 1000,
        easing: ol.easing.easeIn
      })
    );
    vector.set("name", "boundingBox");
    map.getView().fit(vector.getSource().getExtent(), map.getSize());
  };

  $scope.zoomOutExtent = () => {
    const zoom = ol.animation.zoom({
      resolution: map.getView().getResolution(),
      duration: 1000,
      easing: ol.easing.easeOut
    });
    map.beforeRender(zoom);
    map.getView().setZoom(5);
    $scope.currentFrame += 1;
  };
}

module.exports = composerController;
