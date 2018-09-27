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

  function transformCoords(loc) {
    return ol.proj.transform(loc, "EPSG:3857", "EPSG:4326");
  }

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

    drawBoundingBox.on('drawend', evt => {
      drawBoundingBox.setActive(false);
    });
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
    document.getElementById("frameTitle").value =
      $scope.frameSettings[index].title;
    document.getElementById("startDate").value = $scope.formatDates(
      $scope.frameSettings[index].startDate
    );
    document.getElementById("startTime").value =
      $scope.frameSettings[index].startTime;
    document.getElementById("endDate").value = $scope.formatDates(
      $scope.frameSettings[index].endDate
    );
    document.getElementById("endTime").value =
      $scope.frameSettings[index].endTime;
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
    const config = stateSvc.getConfig();
    const frameConfig = config.storyframes[stateSvc.getChapterIndex()].features[index];
    $scope.frameSettings.splice(index, 1);
    if (frameConfig.id) {
      stateSvc.config.removedFrames.push(frameConfig.id);
    }
  };
}
export default frameController;
