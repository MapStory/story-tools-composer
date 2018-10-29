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
  $scope.copiedFrameSettings = [];
  $scope.currentFrame = 0;
  $scope.zoomedIn = false;
  let queryLayerLoaded = false;
  const map = MapManager.storyMap.getMap();

  PubSub.subscribe("updateStoryframes", () => {
    $scope.$apply(() => {
      const fetchedFrameSettings = frameSvc.get("storyFrames");
      const currentChapter = stateSvc.getChapterIndex();
      const fetchedFrames = [];

      if (fetchedFrameSettings && fetchedFrameSettings.length > 0) {
        if ($scope.frameSettings.length < fetchedFrameSettings.length) {
          for (let i = 0; i < fetchedFrameSettings.length; i++) {
            if (fetchedFrameSettings[i].startDate && fetchedFrameSettings[i].endDate) {
              fetchedFrames[i] = {
                id: Date.now(),
                chapter: currentChapter,
                title: fetchedFrameSettings[i].title,
                startDate: new Date(fetchedFrameSettings[i].startDate),
                startTime: fetchedFrameSettings[i].startTime,
                endDate: new Date(fetchedFrameSettings[i].endDate),
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
          }
          $scope.frameSettings = fetchedFrames;
          $scope.copiedFrameSettings = angular.copy($scope.frameSettings);
        }
      }
    })
  });

  $scope.layerViewerMode = window.mapstory.layerViewerMode;

  $scope.composerMode =
    window.mapstory.composerMode !== "False" && !$scope.layerViewerMode;

  function getUrlParam(name) {
    const results = new RegExp(`[\\?&]${name}=([^&#]*)`).exec(
      window.location.href
    );
    return (results && results[1]) || undefined;
  }

  // Adds a layer if specified in the url query
  function addLayerFromUrl() {
    queryLayerLoaded = true;
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
  }

  $scope.stateSvc.previousChapter = $scope.stateSvc.getChapter();

  const loadMap = (event) => {
    const urlChapterId = $location.path().split("chapter/")[1];
    const chapterCount = stateSvc.getChapterCount();
    if (urlChapterId > chapterCount) {
      $scope.navigationSvc.goToChapter(1);
    }
    if (event) {
      PubSub.publish("changingChapter",
        {currentChapterIndex: $scope.stateSvc.getChapter() - 1,
          previousChapterIndex: $scope.stateSvc.previousChapter - 1})
    }
    $scope.mapManager.initMapLoad();
    $scope.stateSvc.updateCurrentChapterConfig();
    $scope.stateSvc.previousChapter = $scope.stateSvc.getChapter();
  };

  window.addEventListener("popstate", loadMap);

  PubSub.subscribe("configInitialized", () => {
    $scope.mapManager.initMapLoad();
    if (!queryLayerLoaded) {
      addLayerFromUrl();
    }
  });

  if (window.mapstory.layerViewerMode) {
    layerSvc.getApiResultsThenAddLayer(window.mapstory.layername);
  }

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

  PubSub.subscribe("chapterCreated", (event, index) => {
    $scope.updateSelected("info", index)
  });

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
    let pinArray = pinSvc.getCurrentPins();
    // This should not be null. Why is this happening?
    if (!pinArray) {
      pinArray = [];
    }
    pinArray.forEach(pin => {
      const startDate = $scope.formatDates(pin.startTime);
      const endDate = $scope.formatDates(pin.endTime);
      const storyLayerStartDate = $scope.formatDates(date);

      const shouldShow = moment(storyLayerStartDate).isSameOrAfter(startDate) && !moment(storyLayerStartDate).isAfter(endDate);

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
    if ($scope.copiedFrameSettings) {
      $scope.getCurrentFrame(data);
    }
  };

  $scope.getCurrentFrame = date => {
    if ($scope.copiedFrameSettings[$scope.currentFrame]) {
      const start = $scope.copiedFrameSettings[$scope.currentFrame].startDate;
      const end = $scope.copiedFrameSettings[$scope.currentFrame].endDate;
      $scope.checkTimes(date, start, end);
    }
  };

  $scope.checkTimes = (date, start, end) => {
    if (moment(date).isSameOrAfter(start) && moment(date).isSameOrBefore(end) && $scope.zoomedIn === false) {
      $scope.zoomToExtent();
    } else if (moment(date).isAfter(end) && $scope.zoomedIn === true) {
      $scope.zoomOutExtent();
      if ($scope.currentFrame <= $scope.copiedFrameSettings.length) { //  -1 need after publish, loop is starting at 1?
        $scope.currentFrame += 1;
        if ($scope.currentFrame === $scope.copiedFrameSettings.length) {
          $scope.currentFrame = 0;
        }
      }
    } else if (moment(date).isBefore(start) || moment(date).isAfter(end)) {
      $scope.zoomOutExtent();
      map.getView().setZoom(1);
      $scope.clearBB();
    }
  };

  $scope.zoomToExtent = () => {
    let polygon;

    if ($scope.copiedFrameSettings[$scope.currentFrame]) {
      polygon = new ol.Feature(
        new ol.geom.Polygon([
          [
            $scope.copiedFrameSettings[$scope.currentFrame].bb1,
            $scope.copiedFrameSettings[$scope.currentFrame].bb2,
            $scope.copiedFrameSettings[$scope.currentFrame].bb3,
            $scope.copiedFrameSettings[$scope.currentFrame].bb4
          ]
        ])
      )
    }
    else if (!$scope.copiedFrameSettings[$scope.currentFrame]) {
      for (let i=0; i < $scope.copiedFrameSettings.length; i ++) {
        polygon = new ol.Feature(
          new ol.geom.Polygon([
            [
              $scope.copiedFrameSettings[i].bb1,
              $scope.copiedFrameSettings[i].bb2,
              $scope.copiedFrameSettings[i].bb3,
              $scope.copiedFrameSettings[i].bb4
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
    $scope.zoomedIn = true;
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
    map.getView().setZoom(1);
    $scope.zoomedIn = false;
    $scope.clearBB();
  };

  $scope.clearBB = () => {
    map.getLayers().forEach(layer => {
      if (layer.get("name") === "boundingBox") {
        map.removeLayer(layer);
      }
    });
  }
}

module.exports = composerController;


