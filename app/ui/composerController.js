function composerController(
  $scope,
  $rootScope,
  $log,
  $injector,
  MapManager,
  styleUpdater,
  appConfig,
  TimeControlsManager,
  navigationSvc,
  pinSvc,
  uiHelperSvc,
  searchSvc,
  stateSvc,
  $location
) {
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.pinSvc = pinSvc;
  $scope.uiHelperSvc = uiHelperSvc;
  $scope.searchSvc = searchSvc;
  $scope.pin = {};

  $rootScope.$on("$locationChangeSuccess", () => {
    $scope.mapManager.initMapLoad();
    $scope.stateSvc.updateCurrentChapterConfig();
  });

  $rootScope.$on("configInitialized", () => $scope.mapManager.initMapLoad());

  $rootScope.$on("pin-added", (event, chapter_index) =>{
    // $log.log($scope.pinSvc.getPins(0))
  });

  $rootScope.$on("chapter-added", (event, config) => pinSvc.addChapter());

  $rootScope.$on("chapter-removed", (event, chapter_index) =>
    pinSvc.removeChapter(chapter_index)
  );

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
    $log.log("STORY MAP LAYERS ---- > ", window.storyMap.getStoryLayers());
    stateSvc.save();
  };

  $scope.newMap = () => $location.path("/new");

  $scope.styleChanged = layer => {
    layer.on("change:type", evt => {
      styleUpdater.updateStyle(evt.target);
    });
    styleUpdater.updateStyle(layer);
  };

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

  $scope.getMapWidth = preview => {
    if (preview === true) {
      return appConfig.dimensions.mapWidthPreviewMode;
    }
    return appConfig.dimensions.mapWidthEditMode;
  };

  $scope.togglePreviewMode = () => {
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
    setTimeout(() => {
      window.storyMap.getMap().updateSize();
    });
  };

  $scope.layerProperties = lyr => {
    const props = lyr.getProperties();
    const features = delete props.features;
    props.featureCount = (features || []).length;
    return props;
  };

  $scope.updateSelected = selected => {
    $scope.selected = { selected: true };
  };

  $scope.nextChapter = navigationSvc.nextChapter;
  $scope.previousChapter = navigationSvc.previousChapter;

  $scope.frameSettings = [];
  const map = MapManager.storyMap.getMap();

  $scope.isDefault = ($event, index) => {
    const elem = document.querySelectorAll(".isDefault");
    for (let i = 0; i < elem.length; i++) {
      elem[i].classList.remove("isDefault");
    }
    $event.currentTarget.parentNode.classList.add("isDefault");
  };

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
          map.getView().setZoom(map.getView().getZoom() * 0.0);
        }
      });
  };

  let draw;
  let layerList = [];

  map.addEventListener("click", event => {
    map.getLayers().forEach(layer => {
      if (layer.get("name") === "boundingBox") {
        const extent = layer.getSource().getExtent();
        layerList.push(layer.get("name"));
        if (layerList.length > 1) {
          const zoom = ol.animation.zoom({
            resolution: map.getView().getResolution()
          });
          map.beforeRender(zoom);
          map.getView().setCenter(extent);
          map.getView().setResolution(map.getView().getResolution() * 0.2);
          map.removeInteraction(draw);
        }
      }
    });
  });

  $scope.drawBoundingBox = () => {
    $scope.clearBoundingBox();
    layerList = [];
    const bbVector = new ol.source.Vector({ wrapX: false });
    const vector = new ol.layer.Vector({
      source: bbVector
    });
    bbVector.on("addfeature", evt => {
      const feature = evt.feature;
      $scope.coords = feature.getGeometry().getCoordinates();
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

  $scope.storyDetails = frameSettings => {
    $scope.frameSettings.push({
      id: Date.now(),
      title: frameSettings.title,
      startDate: frameSettings.startDate,
      startTime: frameSettings.startTime,
      endDate: frameSettings.endDate,
      endTime: frameSettings.endTime,
      radius: frameSettings.radius,
      bb1: transformCoords([$scope.coords[0][0][0], $scope.coords[0][0][1]]),
      bb2: transformCoords([$scope.coords[0][1][0], $scope.coords[0][1][1]]),
      bb3: transformCoords([$scope.coords[0][2][0], $scope.coords[0][2][1]]),
      bb4: transformCoords([$scope.coords[0][3][0], $scope.coords[0][3][1]])
    });
  };

  $scope.editStoryframe = index => {
    $scope.frameSettings.title = $scope.frameSettings[index].title;
    $scope.frameSettings.startDate = $scope.frameSettings[index].startDate;
    $scope.frameSettings.startTime = $scope.frameSettings[index].startTime;
    $scope.frameSettings.endDate = $scope.frameSettings[index].endDate;
    $scope.frameSettings.endTime = $scope.frameSettings[index].endTime;
    $scope.frameSettings.radius = $scope.frameSettings[index].radius;

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
    $scope.frameSettings[$scope.currentIndex].radius =
      $scope.frameSettings.radius;

    $scope.frameSettings[$scope.currentIndex].bb1 = $scope.frameSettings.bb1;
    $scope.frameSettings[$scope.currentIndex].bb2 = $scope.frameSettings.bb2;
    $scope.frameSettings[$scope.currentIndex].bb3 = $scope.frameSettings.bb3;
    $scope.frameSettings[$scope.currentIndex].bb4 = $scope.frameSettings.bb4;

    $scope.disableButton = true;
    $scope.disableButton = !$scope.disableButton;

    $log.log($scope.frameSettings.bb1);
  };

  $scope.deleteStoryframe = index => {
    $scope.frameSettings.splice(index, 1);
  };
}

module.exports = composerController;
