const moment = require("moment");
const $ = require("jquery");

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
  uiHelperSvc,
  searchSvc,
  stateSvc,
  newConfigSvc,
  $location
) {
  let lastSelectedTab = null;
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.pinSvc = pinSvc;
  $scope.uiHelperSvc = uiHelperSvc;
  $scope.searchSvc = searchSvc;
  $scope.navigationSvc = navigationSvc;
  $scope.pin = {};
  $scope.selected = { toc: true };
  $scope.viewerMode = $location.search().viewer;

  if (window.mapstory.composerMode === "False") {
    $scope.composerMode = false;
  } else {
    $scope.composerMode = true;
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

  $rootScope.$on("pin-added", (event, chapter_index) => {
    // $log.log($scope.pinSvc.getPins(0))
  });

  $rootScope.$on("chapter-added", (event, config) => pinSvc.addChapter());

  $rootScope.$on("chapter-removed", (event, chapter_index) =>
    pinSvc.removeChapter(chapter_index)
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
    const urlChapterId = parseInt($location.path().split("chapter/")[1]);
    const chapterCount = stateSvc.getChapterCount();
    const previousChapterId = urlChapterId - 1;
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
    stateSvc.save();
  };

  $scope.publishMap = () => {
    stateSvc.publish();
    $scope.openPublishedModal();
  };

  $scope.newMap = () => $location.path("/new");

  $scope.showLoadMapDialog = () => {
    const promise = loadMapDialog.show();
    promise.then(result => {
      if (result.mapstoryMapId) {
        $location.path(`/maps/${result.mapstoryMapId}/data/`);
      } else if (result.localMapId) {
        $location.path(`/local/${result.localMapId}`);
      }
    });
  };

  $scope.layerProperties = lyr => {
    const props = lyr.getProperties();
    const features = delete props.features;
    props.featureCount = (features || []).length;
    return props;
  };

  $scope.updateSelected = (selected, chapterId, dontCache) => {
    $scope.selected = {};
    if ((chapterId !== null) & (chapterId !== undefined)) {
      navigationSvc.goToChapter(chapterId);
    }
    $scope.selected[selected] = true;
    if (!dontCache) {
      lastSelectedTab = selected;
    }
  };

  $scope.nextChapter = navigationSvc.nextChapter;
  $scope.previousChapter = navigationSvc.previousChapter;

  $scope.openStoryModal = function(size) {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyInfoModal.html",
      size,
      scope: $scope
    });
  };

  $scope.openPublishedModal = function(size) {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyPublished.html",
      size,
      scope: $scope
    });
  };

  $scope.frameSettings = [];
  const map = MapManager.storyMap.getMap();

  function transformCoords(loc) {
    return ol.proj.transform(loc, "EPSG:3857", "EPSG:4326");
  }

  $scope.clearBoundingBox = () => {
    MapManager.storyMap
      .getMap()
      .getLayers()
      .forEach(layer => {
        if (layer.get("name") === "boundingBox") {
          map.removeLayer(layer);
          const zoom = ol.animation.zoom({
            resolution: map.getView().getResolution()
          });
          map.beforeRender(zoom);
          map.getView().setZoom(5);
        }
      });
  };

  $scope.formatDates = date => {
    const preFormatDate = moment(date);
    return preFormatDate.format("YYYY-MM-DD");
  };

  let draw;
  const layerList = [];

  $scope.currentFrame = 0;
  $scope.zoomedIn = false;

  $scope.getCurrentFrame = date => {
    if ($scope.currentFrame < $scope.frameSettings.length) {
      const start = $scope.frameSettings[$scope.currentFrame].startDate;
      const end = $scope.frameSettings[$scope.currentFrame].endDate;
      $scope.checkTimes(date, start, end);
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
    const polygon = new ol.Feature(
      new ol.geom.Polygon([
        [
          $scope.frameSettings[$scope.currentFrame].bb1,
          $scope.frameSettings[$scope.currentFrame].bb2,
          $scope.frameSettings[$scope.currentFrame].bb3,
          $scope.frameSettings[$scope.currentFrame].bb4
        ]
      ])
    );
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
    vector.set("name", $scope.frameSettings[$scope.currentFrame].title);
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

  /**
   * Callback for timeline update.
   * @param data Data from the timeline.
   */
  window.onMoveCallback = data => {
    // Checks times for storyframes.
    $scope.getCurrentFrame(data);
    // Updates StoryPins.
    $scope.updateStorypinTimeline(data);
  };

  $rootScope.$on("updateStorypins", (event, chapters) => {
    for (let c=0; c<chapters.length; c++) {
        for (let f=0; f<chapters[c].storyframes.length; f++) {
            const coords = JSON.parse(chapters[0].storyframes[f].center);
            $scope.frameSettings.push({
                title: chapters[c].storyframes[f].title,
                startDate: moment.unix(chapters[c].storyframes[f].start_time).format('YYYY-MM-DD'),
                endDate: moment.unix(chapters[c].storyframes[f].end_time).format('YYYY-MM-DD'),
                bb1: [coords[0][0], coords[0][1]],
                bb2: [coords[1][0], coords[1][1]],
                bb3: [coords[2][0], coords[2][1]],
                bb4: [coords[3][0], coords[3][1]]
            });
        }
    }
  });

  $scope.formatDates = date => {
    const preFormatDate = moment(date);
    const formattedDate = preFormatDate.format("YYYY-MM-DD");
    return formattedDate;
  };

  $scope.drawBoundingBox = () => {
    $scope.clearBoundingBox();
    const bbVector = new ol.source.Vector({ wrapX: false });
    const vector = new ol.layer.Vector({
      source: bbVector
    });
    bbVector.on("addfeature", evt => {
      $scope.coords = evt.feature.getGeometry().getCoordinates();
    });
    const geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
    draw = new ol.interaction.Draw({
      source: bbVector,
      type: "Circle",
      geometryFunction
    });
    vector.set("name", "boundingBox");
    map.addLayer(vector);
    map.addInteraction(draw);
  };

  $scope.checkBBDefined = (frameSettings) => {
    if ($scope.coords === undefined) {
        $scope.bbDefined = false;
    } else if ($scope.coords) {
        $scope.bbDefined = true;
        $scope.checkTemporalOverlap(frameSettings);
    }
  }

  $scope.checkTemporalOverlap = frameSettings => {
    if (frameSettings.length < 1) {
      $scope.saveStoryDetails(frameSettings);
    } else if ($scope.frameSettings.length >= 1) {
      const numFrames = $scope.frameSettings.length;
      $scope.startOverlap = false;
      $scope.endOverlap = false;

      let x = 0;

      while (x < numFrames) {
        const startToCheck = $scope.formatDates(frameSettings.startDate);
        const endToCheck = $scope.formatDates(frameSettings.endDate);

        const start = $scope.formatDates($scope.frameSettings[x].startDate);
        const end = $scope.formatDates($scope.frameSettings[x].endDate);

        x += 1;

        if (
          moment(startToCheck).isSameOrAfter(start) &&
          moment(startToCheck).isSameOrBefore(end)
        ) {
          $scope.startOverlap = true;
        }
        if (
          moment(endToCheck).isSameOrAfter(start) &&
          moment(endToCheck).isSameOrBefore(end)
        ) {
          $scope.endOverlap = true;
        }
        if ($scope.startOverlap === true || $scope.endOverlap === true) {
          $scope.showOverlapMsg = true;
          return 0;
        }
      }
      if ($scope.startOverlap === false && $scope.endOverlap === false) {
        $scope.saveStoryDetails(frameSettings);
      }
    }
    return 0;
  };

  $scope.saveStoryDetails = frameSettings => {
    $scope.frameSettings.push({
      id: Date.now(),
      title: frameSettings.title,
      startDate: frameSettings.startDate,
      startTime: frameSettings.startTime,
      endDate: frameSettings.endDate,
      endTime: frameSettings.endTime,
      bb1: [$scope.coords[0][0][0], $scope.coords[0][0][1]],
      bb2: [$scope.coords[0][1][0], $scope.coords[0][1][1]],
      bb3: [$scope.coords[0][2][0], $scope.coords[0][2][1]],
      bb4: [$scope.coords[0][3][0], $scope.coords[0][3][1]]
    });
    stateSvc.setStoryframeDetails($scope.frameSettings);
  };

  $scope.editStoryframe = index => {
    $scope.frameSettings.title = $scope.frameSettings[index].title;
    $scope.frameSettings.startDate = $scope.frameSettings[index].startDate;
    $scope.frameSettings.startTime = $scope.frameSettings[index].startTime;
    $scope.frameSettings.endDate = $scope.frameSettings[index].endDate;
    $scope.frameSettings.endTime = $scope.frameSettings[index].endTime;
    $scope.frameSettings.bb1 = transformCoords([
      $scope.coords[0][0][0],
      $scope.coords[0][0][1]
    ]);
    $scope.frameSettings.bb2 = transformCoords([
      $scope.coords[0][1][0],
      $scope.coords[0][1][1]
    ]);
    $scope.frameSettings.bb3 = transformCoords([
      $scope.coords[0][2][0],
      $scope.coords[0][2][1]
    ]);
    $scope.frameSettings.bb4 = transformCoords([
      $scope.coords[0][3][0],
      $scope.coords[0][3][1]
    ]);

    $scope.currentIndex = index;
    $scope.disableButton = false;
    $scope.disableButton = !$scope.disableButton;
  };

  $scope.updateStoryframe = () => {
    $scope.frameSettings[$scope.currentIndex].title =
      $scope.frameSettings.title;
    $scope.frameSettings[$scope.currentIndex].startDate =
      $scope.frameSettings.startDate;
    $scope.frameSettings[$scope.currentIndex].startTime =
      $scope.frameSettings.startTime;
    $scope.frameSettings[$scope.currentIndex].endDate =
      $scope.frameSettings.endDate;
    $scope.frameSettings[$scope.currentIndex].endTime =
      $scope.frameSettings.endTime;

    $scope.frameSettings[$scope.currentIndex].bb1 = $scope.frameSettings.bb1;
    $scope.frameSettings[$scope.currentIndex].bb2 = $scope.frameSettings.bb2;
    $scope.frameSettings[$scope.currentIndex].bb3 = $scope.frameSettings.bb3;
    $scope.frameSettings[$scope.currentIndex].bb4 = $scope.frameSettings.bb4;

    $scope.disableButton = true;
    $scope.disableButton = !$scope.disableButton;
  };

  $scope.deleteStoryframe = index => {
    $scope.frameSettings.splice(index, 1);
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
      const startDate = $scope.formatDates(pin.start_time);
      const endDate = $scope.formatDates(pin.end_time);
      const storyLayerStartDate = $scope.formatDates(date);

      let should_show = false;
      if (moment(storyLayerStartDate).isSameOrAfter(startDate)) {
        // TODO: Show StoryPin.
        should_show = true;
      }
      if (moment(storyLayerStartDate).isSameOrAfter(endDate)) {
        // TODO: Hide Storypin.
        should_show = false;
      }

      if (should_show) {
        pin.show();
      } else {
        pin.hide();
      }
    });
  };
}

module.exports = composerController;
