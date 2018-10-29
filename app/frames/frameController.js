import moment from "moment";


function frameController(
  $scope,
  stateSvc,
  MapManager
) {
  $scope.mapManager = MapManager;
  $scope.stateSvc = stateSvc;
  $scope.showForm = null;

  const map = MapManager.storyMap.getMap();

  $scope.clearBoundingBox = () => {
    map.getLayers().forEach(layer => {
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

  $scope.drawBoundingBox = () => {
    const bbVector = new ol.source.Vector({ wrapX: false });
    const geometryFunction = ol.interaction.Draw.createRegularPolygon(4);

    const vector = new ol.layer.Vector({
      source: bbVector,
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: [0, 193, 206, 1],
          width: 3,
        }),
        fill: new ol.style.Fill({
          color: [255, 255, 255, 0],
        }),
      })
    });

    bbVector.on("addfeature", evt => {
      $scope.coords = evt.feature.getGeometry().getCoordinates();
    });

    const drawBoundingBox = new ol.interaction.Draw({
      source: bbVector,
      type: "Circle",
      geometryFunction,
      style: new ol.style.Style({
        geometryFunction,
        stroke: new ol.style.Stroke({
          color: [0, 193, 206, 1],
          width: 3,
        }),
        fill: new ol.style.Fill({
          color: [255, 255, 255, 0],
        }),
        image: new ol.style.RegularShape({
          fill: new ol.style.Fill({
            color: [255, 255, 255, 0],
          }),
          stroke: new ol.style.Stroke({
            color: [0, 193, 206, 1],
            width: 1
          }),
          points: 4,
          radius: 10,
          angle: Math.PI / 4
        }),
      }),
    });

    vector.set("name", "boundingBox");
    map.addLayer(vector);
    map.addInteraction(drawBoundingBox);

    drawBoundingBox.on("drawend", evt => {
      drawBoundingBox.setActive(false);
    });
  };

  $scope.checkBBDefined = frameSettings => {
    if (!$scope.copiedFrameSettings) {
      $scope.copiedFrameSettings = [];
    }
    const currentChapter = stateSvc.getChapterIndex();
    for (let x = 0; x < frameSettings.length; x += 1) {
      if (frameSettings[x]) {
        $scope.copiedFrameSettings.push({
          id: Date.now(),
          chapter: currentChapter,
          title: frameSettings[x].title,
          startDate: frameSettings[x].startDate,
          startTime: frameSettings[x].startTime,
          endDate: frameSettings[x].endDate,
          endTime: frameSettings[x].endTime,
          bb1: [$scope.coords[x][0][0], $scope.coords[x][0][1]],
          bb2: [$scope.coords[x][1][0], $scope.coords[x][1][1]],
          bb3: [$scope.coords[x][2][0], $scope.coords[x][2][1]],
          bb4: [$scope.coords[x][3][0], $scope.coords[x][3][1]]
        });
      }
    }

    if (!$scope.coords) {
      $scope.bbDefined = false;
    } else if ($scope.coords) {
      $scope.bbDefined = true;
      $scope.checkTemporalOverlap($scope.copiedFrameSettings);
    }
  };

  $scope.checkTemporalOverlap = copiedFrameSettings => {
    if (copiedFrameSettings.length <= 1) {
      $scope.saveStoryDetails(copiedFrameSettings);
    } else if (copiedFrameSettings.length >= 2) {
      const numFrames = copiedFrameSettings.length;
      $scope.startOverlap = false;
      $scope.endOverlap = false;

      let x = 0;

      while (x < numFrames) {
        const startToCheck = $scope.formatDates(copiedFrameSettings[x].startDate);
        const endToCheck = $scope.formatDates(copiedFrameSettings[x].endDate);
        const start = $scope.formatDates(copiedFrameSettings.startDate);
        const end = $scope.formatDates(copiedFrameSettings.endDate);

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
        $scope.saveStoryDetails(copiedFrameSettings);
      }
    }
    return 0;
  };

  $scope.saveStoryDetails = frameSettings => {
    stateSvc.setStoryframeDetails($scope.copiedFrameSettings);
    $scope.resetFramesForm();
  };

  $scope.resetFramesForm = () => {
    document.getElementById("storySettings").reset();
    $scope.clearBoundingBox();
  };

  $scope.editStoryframe = index => {
    $scope.currentIndex = index;
    $scope.disableButton = false;
    $scope.disableButton = !$scope.disableButton;

    document.getElementById("frameTitle").value =
      $scope.copiedFrameSettings[index].title;
    document.getElementById("startDate").value = $scope.formatDates(
      $scope.copiedFrameSettings[index].startDate
    );
    if (document.getElementById("startTime").value) {
      document.getElementById("startTime").value =
      $scope.copiedFrameSettings[index].startTime;
    }
    document.getElementById("endDate").value = $scope.formatDates(
      $scope.copiedFrameSettings[index].endDate
    );
    if (document.getElementById("endTime").value) {
      document.getElementById("endTime").value =
      $scope.copiedFrameSettings[index].endTime;
    }
  };

  $scope.updateStoryframe = () => {
    $scope.disableButton = true;
    $scope.disableButton = !$scope.disableButton;
    $scope.resetFramesForm();

    $scope.copiedFrameSettings[$scope.currentIndex].title = $scope.frameSettings[$scope.currentIndex].title;
    $scope.copiedFrameSettings[$scope.currentIndex].startDate = $scope.frameSettings[$scope.currentIndex].startDate;
    $scope.copiedFrameSettings[$scope.currentIndex].startTime = $scope.frameSettings[$scope.currentIndex].startTime;
    $scope.copiedFrameSettings[$scope.currentIndex].endDate = $scope.frameSettings[$scope.currentIndex].endDate;
    $scope.copiedFrameSettings[$scope.currentIndex].endTime = $scope.frameSettings[$scope.currentIndex].endTime;
    $scope.copiedFrameSettings[$scope.currentIndex].bb1 = $scope.coords[0][0];
    $scope.copiedFrameSettings[$scope.currentIndex].bb2 = $scope.coords[0][1];
    $scope.copiedFrameSettings[$scope.currentIndex].bb3 = $scope.coords[0][2];
    $scope.copiedFrameSettings[$scope.currentIndex].bb4 = $scope.coords[0][3];
  };

  $scope.deleteStoryframe = index => {
    $scope.copiedFrameSettings.splice(index, 1);
    const config = stateSvc.getConfig();
    const frameConfig = config.storyframes[stateSvc.getChapterIndex()].features[index];
    if (frameConfig.id) {
      stateSvc.config.removedFrames.push(frameConfig.id);
    }
  };
}
export default frameController;
