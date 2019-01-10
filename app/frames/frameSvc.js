import moment from "moment";
import PubSub from "pubsub-js";

function frameSvc(stateSvc, pinSvc, MapManager, $rootScope) {
  const svc = {};
  svc.mapManager = MapManager;
  const map = MapManager.storyMap.getMap();
  svc.frameSettings = [];
  svc.copiedFrameSettings = [];
  svc.currentFrame = 0;

  window.storypinCallback = data => {
    // Updates StoryPins
    svc.updateStorypinTimeline(data);
    // Updates StoryFrames
    if (svc.copiedFrameSettings) {
      svc.getCurrentFrame(data);
    }
  };

  PubSub.subscribe("updateStoryframes", (event, chapters) => {
    stateSvc.config.storyframes = [];
    for (let c = 0; c < chapters.length; c++) {
      for (let f = 0; f < chapters[c].storyframes.length; f++) {
        const coords = JSON.parse(chapters[c].storyframes[f].center);

        stateSvc.config.storyframes.push({
          title: chapters[c].storyframes[f].title,
          id: chapters[c].storyframes[f].id,
          chapter: c,
          startDate: moment
            .unix(chapters[c].storyframes[f].start_time)
            .format("YYYY-MM-DD"),
          endDate: moment
            .unix(chapters[c].storyframes[f].end_time)
            .format("YYYY-MM-DD"),
          bb1: [coords[0][0], coords[0][1]],
          bb2: [coords[1][0], coords[1][1]],
          bb3: [coords[2][0], coords[2][1]],
          bb4: [coords[3][0], coords[3][1]]
        });
      }
    }
    svc.storyFrames = stateSvc.config.storyframes;
  });

  const updateStoryframesHandler = () => {
    $rootScope.$apply(() => {
      svc.currentFrame = 0;
      let fetchedFrameSettings = svc.get("storyFrames");

      if (fetchedFrameSettings) {
        fetchedFrameSettings = fetchedFrameSettings.filter(
          f => f.chapter === stateSvc.getChapterIndex()
        );
      }
      const fetchedFrames = [];

      for (let i = 0; i < fetchedFrameSettings.length; i++) {
        if (
          fetchedFrameSettings[i].startDate &&
          fetchedFrameSettings[i].endDate
        ) {
          fetchedFrames[i] = {
            id: fetchedFrameSettings[i].id,
            chapter: fetchedFrameSettings[i].chapter,
            title: fetchedFrameSettings[i].title,
            startDate: new Date(
              moment.utc(fetchedFrameSettings[i].startDate).format("l LT")
            ),
            startTime: fetchedFrameSettings[i].startTime,
            endDate: new Date(
              moment.utc(fetchedFrameSettings[i].endDate).format("l LT")
            ),
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
      svc.frameSettings = fetchedFrames;
      svc.copiedFrameSettings = angular.copy(svc.frameSettings);
    });
  };

  PubSub.subscribe("updateStoryframes", updateStoryframesHandler);
  PubSub.subscribe("changingChapter", updateStoryframesHandler);

  svc.getCurrentFrame = date => {
    const frame = svc.copiedFrameSettings.filter(
      f => f.chapter === stateSvc.getChapterIndex()
    )[svc.currentFrame];

    if (frame) {
      const start = frame.startDate;
      const end = frame.endDate;
      svc.checkTimes(date, start, end);
    }
  };

  /**
   * Updates the Storypins on timeline.
   * Loops the current chapter's StoryPins and determines if they should be shown or hidden.
   * @param date The date for the layer.
   */
  svc.updateStorypinTimeline = date => {
    // TODO: Use pre-cooked timeframe objects to optimize this?
    let pinArray = pinSvc.getCurrentPins();
    // This should not be null. Why is this happening?
    if (!pinArray) {
      pinArray = [];
    }
    pinArray.forEach(pin => {
      const startDate = svc.formatDates(pin.startTime);
      const endDate = svc.formatDates(pin.endTime);
      const storyLayerStartDate = svc.formatDates(date);

      const shouldShow =
        moment(storyLayerStartDate).isSameOrAfter(startDate) &&
        !moment(storyLayerStartDate).isAfter(endDate);

      if (shouldShow) {
        pin.show();
      } else {
        pin.hide();
      }
    });
  };

  svc.checkTimes = (date, start, end) => {
    if (
      moment(date).isSameOrAfter(start) &&
      moment(date).isSameOrBefore(end) &&
      svc.zoomedIn === false
    ) {
      svc.zoomToExtent();
    } else if (moment(date).isAfter(end) && svc.zoomedIn === true) {
      svc.zoomOutExtent();
      if (svc.currentFrame <= svc.copiedFrameSettings.length) {
        svc.currentFrame += 1;
        if (svc.currentFrame === svc.copiedFrameSettings.length) {
          svc.currentFrame = 0;
        }
      }
    } else if (moment(date).isBefore(start) || moment(date).isAfter(end)) {
      svc.clearBB();
    }
  };

  svc.formatDates = date => {
    const preFormatDate = moment(date);
    return preFormatDate.format("YYYY-MM-DD");
  };

  svc.zoomToExtent = () => {
    let polygon;

    if (svc.copiedFrameSettings[svc.currentFrame]) {
      polygon = new ol.Feature(
        new ol.geom.Polygon([
          [
            svc.copiedFrameSettings[svc.currentFrame].bb1,
            svc.copiedFrameSettings[svc.currentFrame].bb2,
            svc.copiedFrameSettings[svc.currentFrame].bb3,
            svc.copiedFrameSettings[svc.currentFrame].bb4
          ]
        ])
      );
    } else if (!svc.copiedFrameSettings[svc.currentFrame]) {
      for (let i = 0; i < svc.copiedFrameSettings.length; i++) {
        polygon = new ol.Feature(
          new ol.geom.Polygon([
            [
              svc.copiedFrameSettings[i].bb1,
              svc.copiedFrameSettings[i].bb2,
              svc.copiedFrameSettings[i].bb3,
              svc.copiedFrameSettings[i].bb4
            ]
          ])
        );
      }
    }

    const vector = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [polygon]
      })
    });

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
    svc.zoomedIn = true;
    vector.set("name", "boundingBox");
    map.getView().fit(polygon.getGeometry(), map.getSize());
  };

  svc.zoomOutExtent = () => {
    const extent = ol.extent.createEmpty();
    svc.mapManager.storyMap.getStoryLayers().forEach(layer => {
      ol.extent.extend(extent, layer.get("extent"));
    });

    const zoom = ol.animation.zoom({
      resolution: map.getView().getResolution(),
      duration: 1000,
      easing: ol.easing.easeOut
    });
    map.beforeRender(zoom);

    if (svc.mapManager.storyMap.getStoryLayers().length > 0) {
      map.getView().fit(extent, map.getSize());
    } else {
      map.getView().setZoom(3);
    }

    svc.zoomedIn = false;
    svc.clearBB();
  };

  svc.clearBB = () => {
    map.getLayers().forEach(layer => {
      if (layer.get("name") === "boundingBox") {
        map.removeLayer(layer);
      }
    });
  };

  svc.get = prop => svc[prop];
  return svc;
}

export default frameSvc;
