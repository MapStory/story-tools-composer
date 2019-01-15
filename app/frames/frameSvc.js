import moment from "moment";
import PubSub from "pubsub-js";

export default function frameSvc(stateSvc, pinSvc, MapManager, $rootScope) {
  frameSvc.mapManager = MapManager;
  const map = MapManager.storyMap.getMap();
  frameSvc.frameSettings = [];
  frameSvc.copiedFrameSettings = [];
  frameSvc.currentFrame = 0;

  window.storypinCallback = data => {
    // Updates StoryPins
    frameSvc.updateStorypinTimeline(data);
    // Updates StoryFrames
    if (frameSvc.copiedFrameSettings) {
      frameSvc.getCurrentFrame(data);
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
    frameSvc.storyFrames = stateSvc.config.storyframes;
  });

  const updateStoryframesHandler = () => {
    $rootScope.$apply(() => {
      frameSvc.currentFrame = 0;
      let fetchedFrameSettings = frameSvc.get("storyFrames");

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
      frameSvc.frameSettings = fetchedFrames;
      frameSvc.copiedFrameSettings = angular.copy(frameSvc.frameSettings);
    });
  };

  PubSub.subscribe("updateStoryframes", updateStoryframesHandler);
  PubSub.subscribe("changingChapter", updateStoryframesHandler);

  frameSvc.getCurrentFrame = date => {
    const frame = frameSvc.copiedFrameSettings.filter(
      f => f.chapter === stateSvc.getChapterIndex()
    )[frameSvc.currentFrame];

    if (frame) {
      const start = frame.startDate;
      const end = frame.endDate;
      frameSvc.checkTimes(date, start, end);
    }
  };

  /**
   * Updates the Storypins on timeline.
   * Loops the current chapter's StoryPins and determines if they should be shown or hidden.
   * @param date The date for the layer.
   */
  frameSvc.updateStorypinTimeline = date => {
    // TODO: Use pre-cooked timeframe objects to optimize this?
    let pinArray = pinSvc.getCurrentPins();
    // This should not be null. Why is this happening?
    if (!pinArray) {
      pinArray = [];
    }
    pinArray.forEach(pin => {
      const startDate = frameSvc.formatDates(pin.startTime);
      const endDate = frameSvc.formatDates(pin.endTime);
      const storyLayerStartDate = frameSvc.formatDates(date);

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

  frameSvc.checkTimes = (date, start, end) => {
    if (
      moment(date).isSameOrAfter(start) &&
      moment(date).isSameOrBefore(end) &&
      frameSvc.zoomedIn === false
    ) {
      frameSvc.zoomToExtent();
    } else if (moment(date).isAfter(end) && frameSvc.zoomedIn === true) {
      frameSvc.zoomOutExtent();
      if (frameSvc.currentFrame <= frameSvc.copiedFrameSettings.length) {
        frameSvc.currentFrame += 1;
        if (frameSvc.currentFrame === frameSvc.copiedFrameSettings.length) {
          frameSvc.currentFrame = 0;
        }
      }
    } else if (moment(date).isBefore(start) || moment(date).isAfter(end)) {
      frameSvc.clearBB();
    }
  };

  frameSvc.formatDates = date => {
    const preFormatDate = moment(date);
    return preFormatDate.format("YYYY-MM-DD");
  };

  frameSvc.zoomToExtent = () => {
    let polygon;

    if (frameSvc.copiedFrameSettings[frameSvc.currentFrame]) {
      polygon = new ol.Feature(
        new ol.geom.Polygon([
          [
            frameSvc.copiedFrameSettings[frameSvc.currentFrame].bb1,
            frameSvc.copiedFrameSettings[frameSvc.currentFrame].bb2,
            frameSvc.copiedFrameSettings[frameSvc.currentFrame].bb3,
            frameSvc.copiedFrameSettings[frameSvc.currentFrame].bb4
          ]
        ])
      );
    } else if (!frameSvc.copiedFrameSettings[frameSvc.currentFrame]) {
      for (let i = 0; i < frameSvc.copiedFrameSettings.length; i++) {
        polygon = new ol.Feature(
          new ol.geom.Polygon([
            [
              frameSvc.copiedFrameSettings[i].bb1,
              frameSvc.copiedFrameSettings[i].bb2,
              frameSvc.copiedFrameSettings[i].bb3,
              frameSvc.copiedFrameSettings[i].bb4
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
    frameSvc.zoomedIn = true;
    vector.set("name", "boundingBox");
    map.getView().fit(polygon.getGeometry(), map.getSize());
  };

  frameSvc.zoomOutExtent = () => {
    const extent = ol.extent.createEmpty();
    frameSvc.mapManager.storyMap.getStoryLayers().forEach(layer => {
      ol.extent.extend(extent, layer.get("extent"));
    });

    const zoom = ol.animation.zoom({
      resolution: map.getView().getResolution(),
      duration: 1000,
      easing: ol.easing.easeOut
    });
    map.beforeRender(zoom);

    if (frameSvc.mapManager.storyMap.getStoryLayers().length > 0) {
      map.getView().fit(extent, map.getSize());
    } else {
      map.getView().setZoom(3);
    }

    frameSvc.zoomedIn = false;
    frameSvc.clearBB();
  };

  frameSvc.clearBB = () => {
    map.getLayers().forEach(layer => {
      if (layer.get("name") === "boundingBox") {
        map.removeLayer(layer);
      }
    });
  };

  frameSvc.get = prop => frameSvc[prop];
}
