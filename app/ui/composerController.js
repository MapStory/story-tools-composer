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
  $scope.frameSvc = frameSvc;
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.pinSvc = pinSvc;
  $scope.navigationSvc = navigationSvc;
  $scope.pin = {};
  $scope.selected = { toc: true };
  $scope.viewerMode = $location.search().viewer;
  $scope.showForm = null;
  $scope.frameSvc.zoomedIn = false;
  let queryLayerLoaded = false;

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

  const loadMap = event => {
    const urlChapterId = $location.path().split("chapter/")[1];
    const chapterCount = stateSvc.getChapterCount();
    if (urlChapterId > chapterCount) {
      $scope.navigationSvc.goToChapter(1);
    }
    if (event) {
      PubSub.publish("changingChapter", {
        currentChapterIndex: $scope.stateSvc.getChapter() - 1,
        previousChapterIndex: $scope.stateSvc.previousChapter - 1
      });
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
    if (stateSvc.config.about.title) {
      stateSvc.save();
      pinSvc.onStoryPinSave();
    }
  };

  $scope.publishMap = () => {
    const wasPublished = stateSvc.getConfig().isPublished;
    stateSvc.publish().then(() => {
      let callback;
      if (!wasPublished) {
        callback = stateSvc.updateLocationUsingStoryId.bind(stateSvc, stateSvc.getConfig().storyID);
      }
      $scope.openPublishedModal(undefined, callback);
    });
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
    $scope.updateSelected("info", index);
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

  $scope.openPublishedModal = (size, callOnClose) => {
    const uibmodalInstance = $uibModal.open({
      templateUrl: "app/ui/templates/storyPublished.html",
      size,
      scope: $scope
    });
    $scope.close = () => {
      uibmodalInstance.dismiss("close");
      if (callOnClose) {
        callOnClose();
      }
    };
  };
}

module.exports = composerController;
