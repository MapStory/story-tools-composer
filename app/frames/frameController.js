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
        map.getView().setZoom(3);
      }
    });
  };

  $scope.formatDates = date => {
    const preFormatDate = moment(date);
    return preFormatDate.format("YYYY-MM-DD");
  };


  const zoomToExtent = extent => {
    const [botLeftLon, botLeftLat, topRightLon, topRightLat] = extent;
    const topLeft = [botLeftLon, topRightLat];
    const topRight = [topRightLon, topRightLat];
    const bottomLeft = [botLeftLon, botLeftLat];
    const bottomRight = [topRightLon, botLeftLat];
    $scope.coords = [[topLeft, topRight, bottomRight, bottomLeft, topLeft]];

    const polygon = new ol.Feature(
      new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft, topLeft]])
    );
    const vector = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [polygon]
      })
    });

    $scope.zoomedIn = true;
    vector.set("name", "boundingBox");
    map.addLayer(vector);
    /*
      TODO: This really needs to be fixed by setting the map height correctly,
            but right now there's too large of a chance of that breaking other UI elements
    */
    map.getView().fit(polygon.getGeometry(), map.getSize(), {padding:[70, 0, 0, 0]});
  };

  const removeBoundingBox = () => {
    const boxLayer = map.getLayers().getArray().find(layer => layer.get("name") === "boundingBox");

    if (boxLayer) {
      map.removeLayer(boxLayer);
    }
  };

  $scope.drawBoundingBox = () => {
    removeBoundingBox();
    const dragBox = new ol.interaction.DragBox({
      condition: ol.events.condition.shiftKeyOnly
    });

    map.addInteraction(dragBox);
    dragBox.on("boxend", e => {
      const extent = dragBox.getGeometry().getExtent();
      zoomToExtent(extent);
    });
  };


  $scope.$watch("frameSettings[0].endDate", () => {
    if ($scope.frameSettings[0]) {
      $scope.checkTemporalOverlap($scope.copiedFrameSettings, $scope.frameSettings[0].title, $scope.frameSettings[0].startDate, $scope.frameSettings[0].endDate);
    }
  });

  $scope.$watch("frameSettings[0].startDate", () => {
    if ($scope.frameSettings[0]) {
      $scope.checkTemporalOverlap($scope.copiedFrameSettings, $scope.frameSettings[0].title, $scope.frameSettings[0].startDate, $scope.frameSettings[0].endDate);
    }
  });

  $scope.checkBBDefined = frameSettings => {
    $scope.zoomOutExtent();
    $scope.resetFramesForm();
    const currentChapter = stateSvc.getChapterIndex();
    for (let x = 0; x < frameSettings.length; x += 1) {
      if (frameSettings[x] && $scope.coords[x]) {
        $scope.copiedFrameSettings.push({
          id: Date.now(),
          chapter: currentChapter,
          title: frameSettings[x].title,
          startDate: frameSettings[x].startDate,
          startTime: frameSettings[x].startTime,
          endDate: frameSettings[x].endDate,
          endTime: frameSettings[x].endTime,
          bb1: $scope.coords[x][1],
          bb2: $scope.coords[x][2],
          bb3: $scope.coords[x][3],
          bb4: $scope.coords[x][4]
        });
      }
    }
    if (!$scope.coords) {
      $scope.bbDefined = false;
    } else if ($scope.coords) {
      $scope.bbDefined = true;
      if (!$scope.showOverlapMsg) {
        $scope.saveStoryDetails($scope.copiedFrameSettings);
      }
    }
  };

  $scope.checkTemporalOverlap = (copiedFrameSettings, title, startToCheck, endToCheck) => {
    const framesInChapter = copiedFrameSettings.filter(item => item.chapter === stateSvc.getChapterIndex());
    if (framesInChapter.length <= 0) {
      $scope.startOverlap = false;
      $scope.endOverlap = false;
      $scope.showOverlapMsg = false;
    } else if (framesInChapter.length >= 1) {
      const numFrames = framesInChapter.length;
      $scope.startOverlap = false;
      $scope.endOverlap = false;

      for (let y = 0; y < numFrames; ++y) {
        const start = moment(framesInChapter[y].startDate);
        const end = moment(framesInChapter[y].endDate);
        if (framesInChapter[y].title !== title) {
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
      }

      if ($scope.startOverlap === false && $scope.endOverlap === false) {
        $scope.showOverlapMsg = false;
      }
    }
    return 0;
  };

  $scope.saveStoryDetails = () => {
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
    document.getElementById("endDate").value = $scope.formatDates(
      $scope.copiedFrameSettings[index].endDate
    );
    const coords =  [$scope.copiedFrameSettings[index].bb3,
      $scope.copiedFrameSettings[index].bb1
    ];
    removeBoundingBox();
    zoomToExtent(coords.flatten());
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
    const frameConfig = config.storyframes[index];
    if (frameConfig.id) {
      stateSvc.config.removedFrames.push(frameConfig.id);
    }
    removeBoundingBox();
  };
}

export default frameController;
