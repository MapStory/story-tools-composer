const moment = require("moment");

function frameController(
  $scope,
  $rootScope,
  $log,
  $injector,
  $timeout,
  $uibModal,
  stateSvc,
  frameSvc,
  MapManager
) {
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.showForm = null;

  $scope.frameSettings = [];
  $scope.fetchedFrameSettings = [];
  const map = MapManager.storyMap.getMap();

  function transformCoords(loc) {
    return ol.proj.transform(loc, "EPSG:3857", "EPSG:4326");
  }


  $scope.$watch(angular.bind($scope, () => {

    console.log("watch");

    $scope.fetchedFrameSettings = [];

    $scope.fetchedFrameSettings = frameSvc.get("storyFrames");


    if ($scope.fetchedFrameSettings && $scope.fetchedFrameSettings.length > 0) {
      $scope.frameSettings = [];
      const frameSettingsTemp = [];
      const currentChapter = stateSvc.getChapterIndex();


      frameSettingsTemp.push({
        id: Date.now(),
        chapter: currentChapter,
        title: $scope.fetchedFrameSettings[1].title,
        startDate: $scope.fetchedFrameSettings[1].startDate,
        startTime: $scope.fetchedFrameSettings[1].startTime,
        endDate: $scope.fetchedFrameSettings[1].endDate,
        endTime: $scope.fetchedFrameSettings[1].endTime,
        bb1: [$scope.fetchedFrameSettings[1].bb1[0], $scope.fetchedFrameSettings[1].bb1[1]],
        bb2: [$scope.fetchedFrameSettings[1].bb2[0], $scope.fetchedFrameSettings[1].bb2[1]],
        bb3: [$scope.fetchedFrameSettings[1].bb3[0], $scope.fetchedFrameSettings[1].bb3[1]],
        bb4: [$scope.fetchedFrameSettings[1].bb4[0], $scope.fetchedFrameSettings[1].bb4[1]]
      });

      console.log("after push, frameSettingsTemp: ", frameSettingsTemp);

      $scope.frameSettings = frameSettingsTemp;

    }

    // return $scope.frameSettings;
  }));






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

  $scope.currentFrame = 0;
  $scope.zoomedIn = false;

  $scope.getCurrentFrame = date => {
    console.log("$scope.getCurrentFrame: ", date);

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

  $scope.formatDates = date => {
    const preFormatDate = moment(date);
    const formattedDate = preFormatDate.format("YYYY-MM-DD");
    return formattedDate;
  };

  $scope.drawBoundingBox = () => {
    $scope.clearBoundingBox();
    const bbVector = new ol.source.Vector({wrapX: false});
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

  $scope.checkBBDefined = frameSettings => {
    if ($scope.coords === undefined) {
      $scope.bbDefined = false;
    } else if ($scope.coords) {
      $scope.bbDefined = true;
      $scope.checkTemporalOverlap(frameSettings);
    }
  };

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
    const currentChapter = stateSvc.getChapterIndex();
    $scope.frameSettings.push({
      id: Date.now(),
      chapter: currentChapter,
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
    $scope.resetFramesForm();
    stateSvc.setStoryframeDetails($scope.frameSettings);
  };

  $scope.resetFramesForm = () => {
    document.getElementById("storySettings").reset();
    $scope.clearBoundingBox();
  };

  $scope.editStoryframe = index => {
    document.getElementById("frameTitle").value = $scope.frameSettings[index].title;
    document.getElementById("startDate").value = $scope.formatDates($scope.frameSettings[index].startDate);
    document.getElementById("startTime").value = $scope.frameSettings[index].startTime;
    document.getElementById("endDate").value = $scope.formatDates($scope.frameSettings[index].endDate);
    document.getElementById("endTime").value = $scope.frameSettings[index].endTime;
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
    $scope.resetFramesForm();
  };

  $scope.deleteStoryframe = index => {
    $scope.frameSettings.splice(index, 1);
  };

  /**
   * Callback for timeline update.
   * @param data Data from the timeline.
   */
  window.frameCallback = data => {
    console.log("framecallback date: ", data);
    $scope.getCurrentFrame(data);
  };
}

module.exports = frameController;