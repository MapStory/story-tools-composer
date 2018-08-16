import moment from "moment";
import PubSub from "pubsub-js";

function composerController(
  $scope,
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
  layerSvc,
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

  $scope.$watch(
    angular.bind($scope, () => {
      const fetchedFrameSettings = frameSvc.get("storyFrames");
      const currentChapter = stateSvc.getChapterIndex();
      const fetchedFrames = [];

      if (fetchedFrameSettings && fetchedFrameSettings.length > 0) {
        if ($scope.frameSettings.length < fetchedFrameSettings.length) {
          for (let i = 1; i < fetchedFrameSettings.length; i++) {
            fetchedFrames[i] = {
              id: Date.now(),
              chapter: currentChapter,
              title: fetchedFrameSettings[i].title,
              startDate: fetchedFrameSettings[i].startDate,
              startTime: fetchedFrameSettings[i].startTime,
              endDate: fetchedFrameSettings[i].endDate,
              endTime: fetchedFrameSettings[i].endTime,
              bb1: [
                fetchedFrameSettings[i].bb1[0],
                fetchedFrameSettings[i].bb1[1]
              ],
              bb2: [
                fetchedFrameSettings[i].bb2[0],
                fetchedFrameSettings[i].bb2[1]
              ],
              bb3: [
                fetchedFrameSettings[i].bb3[0],
                fetchedFrameSettings[i].bb3[1]
              ],
              bb4: [
                fetchedFrameSettings[i].bb4[0],
                fetchedFrameSettings[i].bb4[1]
              ]
            };
          }
          $scope.frameSettings = fetchedFrames.reverse();
        }
      }
    })
  );

  $scope.layerViewerMode = window.mapstory.layerViewerMode;

  $scope.composerMode =
    window.mapstory.composerMode !== "False" && !$scope.layerViewerMode;

  function getUrlParam(name) {
    const results = new RegExp(`[\\?&]${name}=([^&#]*)`).exec(
      window.location.href
    );
    return (results && results[1]) || undefined;
  }

  // Adds a layer if there is one
  const layer = getUrlParam("layer");
  if (layer > "") {
    const nameParts = layer.split(":");
    const simpleName = nameParts[1];
    const serviceName = nameParts[0];
    const settings = {
      asVector: false,
      allowZoom: true,
      allowPan: true
    };
    if (serviceName !== "geonode") {
      layerSvc.getRemoteServiceUrl(layer).then(res => {
        const server = {
          absolutePath: res.url,
          canStyleWMS: false,
          name: "remote",
          type: "remote",
          path: ""
        };
        settings.params = res.params;
        MapManager.addLayer({ name: simpleName, settings, server });
      });
    } else {
      MapManager.addLayer({
        name: simpleName,
        settings,
        server: layerSvc.server.active
      });
    }
  }

  const loadMap = () => {
    const urlChapterId = $location.path().split("chapter/")[1];
    const chapterCount = stateSvc.getChapterCount();
    if (urlChapterId > chapterCount) {
      $scope.navigationSvc.goToChapter(1);
    }
    $scope.mapManager.initMapLoad();
    $scope.stateSvc.updateCurrentChapterConfig();
  };

  window.addEventListener("load", loadMap);
  window.addEventListener("popstate", loadMap);

  PubSub.subscribe("configInitialized", () => {
    $scope.mapManager.initMapLoad();
  });

  if (window.mapstory.layerViewerMode) {
    layerSvc.getApiResultsThenAddLayer(window.mapstory.layername);
  }

  PubSub.subscribe("chapter-added", (event, config) => {
    pinSvc.addChapter();
  });

  PubSub.subscribe("chapter-removed", (event, chapterIndex) =>
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
  $scope.mapWidth = $scope.layerViewerMode
    ? appConfig.dimensions.layerViewerMode
    : appConfig.dimensions.mapWidthEditMode;
  setTimeout(() => {
    window.storyMap.getMap().updateSize();
  });
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


    if ($scope.currentFrame < $scope.frameSettings.length) {
      if (typeof $scope.frameSettings[$scope.currentFrame] === "undefined") {
        $scope.currentFrame += 1;
      } else {
        const start = $scope.frameSettings[$scope.currentFrame].startDate;
        const end = $scope.frameSettings[$scope.currentFrame].endDate;
        $scope.checkTimes(date, start, end);
      }
    }
  }

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

    if ($scope.frameSettings[$scope.currentFrame]) {

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
    else if (!$scope.frameSettings[$scope.currentFrame]) {
      for (let i=1; i < $scope.frameSettings.length; i ++) {
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
