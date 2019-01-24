import {Events, createRange, rangesEqual, computeRange, pickInterval} from "./utils";
import TimeModel from "./TimeModel";
import TimeSlider from "./TimeSlider";
import TimeLine from "./TimeLine";
import {MapController} from "./maps";

/**
 * Facade object and guts of slider/timeline/playback logic.
 *
 * Since playback is driven by a timeout, all other potential events
 * are fired in an async manner to ensure a uniform API.
 */
function TimeController(model, slider, timeline, controls) {
  this.model = model;
  this.slider = slider;
  this.timeline = timeline;
  this.loop = "none";

  let self = this,
    currentTimelineWindow = getTimelineWindow(),
    isAdjusting = false,
    started = false,
    timeout = null,
    events = new Events(),
    deferred = [];

  function getTimelineWindow() {
    return createRange(timeline.getWindow());
  }

  function adjust(fun, a, b) {
    if (isAdjusting) {
      return;
    }
    isAdjusting = true;
    try {
      fun(a, b);
    } finally {
      isAdjusting = false;
    }
  }

  function centerTimeline(range) {
    const c = model.mode === "cumulative" ? range.end : range.center();
    timeline.moveTo(c);
    publishRangeChange(range);
  }

  function adjustSlider(range) {
    if (timeline.isWindowMax()) {
      return;
    }

    const center = range.center();
    const idx = model.getIndex(center);
    if (model.mode === "cumulative") {
      slider.growTo(idx);
    } else {
      slider.center(idx);
    }
    timeline.setTime(center);
    publishRangeChange(slider.getRange());
  }

  function updateSlider(range) {
    if (rangesEqual(range, currentTimelineWindow)) {
      return;
    }
    range = createRange(range);
    // zoom or scroll event?
    if (range.width() !== currentTimelineWindow.width()) {
      timeline.moveToCurrentTime();
    } else {
      adjustSlider(range);
    }
    currentTimelineWindow = range;
  }

  slider.on("rangeChanged", (range) => {
    clearTimeout();
    adjust(centerTimeline, range);
    schedule();
  });
  timeline.on("rangechanged", (range) => {
    adjust(updateSlider, range);
  });
  timeline.on("select", (properties) => {
    console.log("Selected items: ", properties.items);
  });
  function clearTimeout() {
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    timeout = null;
  }

  function move(amt) {
    timeout = null;
    let atEnd;
    if (model.mode === "cumulative") {
      atEnd = slider.grow(amt);
    } else {
      atEnd = slider.move(amt);
    }
    if (atEnd) {
      if (self.loop === "chapter") {
        slider.jump(0);
      } else if (self.loop === "story") {
        const currentChapter = window.location.hash.split("/")[2];
        const nextChapter = currentChapter === undefined || currentChapter === null ? 2 : parseInt(currentChapter) + 1;
        slider.jump(0);
        controls.nextChapter();
      } else {
        self.stop();
      }
    }
    centerTimeline(slider.getRange());
    if (started) {
      schedule();
    }
  }

  function schedule() {
    if (started) {
      // @todo respect playback interval options...
      const wait = model.interval;
      $.when(...deferred).then(() => {
        if (started) {
          timeout = window.setTimeout(move, wait, 1);
        }
      }, function() {
        // the deferred was rejected, if arguments provided, this
        // represents an error state so don't continue playing
        if (arguments.length === 0 && started && timeout === null) {
          timeout = window.setTimeout(move, wait, 1);
        } else {
          self.stop();
        }
      });
      deferred = [];
    }
  }


  function run() {
    publishStateChange("running");
    move(1);
  }

  function publishRangeChange(data) {
    if (typeof data === "undefined") {
      data = slider.getRange();
    }
    publish("rangeChange", data);
  }

  function publishStateChange(state) {
    publish("stateChange", state);
  }

  function publish(event, data) {
    events.event(event).publish(data);
    // For some reason, importing PubSub normally
    // doesn't allow listeners in composer to listen to these events
    window.PubSub.publish(event, {loop: self.loop, data});
  }

  this.defer = function(defer) {
    deferred.push(defer);
  };
  this.getCurrentRange = function() {
    return slider.getRange();
  };
  this.update = function(options) {
    model.update(options);
    slider.update(model);
    timeline.update(model);
    window.setTimeout(publishRangeChange, 0);
  };
  this.start = function() {
    if (started) {
      return;
    }
    deferred = [];
    started = true;
    window.setTimeout(run, 0);
  };
  this.stop = function() {
    deferred = [];
    started = false;
    clearTimeout();
    window.setTimeout(publishStateChange, 0, "stopped");
  };
  this.next = function() {
    clearTimeout();
    window.setTimeout(move, 0, 1);
  };
  this.prev = function() {
    clearTimeout();
    window.setTimeout(move, 0, -1);
  };
  this.isStarted = function() {
    return started;
  };
  this.isReady = function() {
    const r = model.getRange();
    return r.start !== null && r.end !== null;
  };
  this.on = function(event, f) {
    events.event(event).subscribe(f);
  };
  window.PubSub.subscribe("mediaPause", this.stop);
  window.PubSub.subscribe("mediaContinue", this.start);
}

/**
 * annotation model:
 * title
 * content
 * the_geom
 * start_time
 * end_time
 * in_timeline
 * in_map
 * appearance
 */
function Annotations(annotations) {
  const ann = annotations || [];
  function inTimeline() {
    return ann.filter((a) => a.in_timeline);
  }
  this.getTimeLineAnnotatons = function() {
    return inTimeline(true);
  };
  this.update = function(annotations) {
    this.ann = annotations;
  };
}

/**
 * box model:
 * title
 * content
 * the_geom
 * start_time
 * end_time
 * in_timeline
 * in_map
 * appearance
 */
function Boxes(boxes) {
  const box = boxes || [];
  function inTimeline() {
    return box.filter((b) => 
      true// b.in_timeline;
    );
  }
  this.getTimeLineBoxes = function() {
    return inTimeline(true);
  };
  this.update = function(boxes) {
    this.box = boxes;
  };
}


/**
 * common lingo:
 * instant: a single point in time
 * extent, range: has property start and end
 * start, end: long values representing UTC (internal) but generally,
 *             a date
 * interval: multipier * precision
 * precision: tick, second, minute, hour, day, week, month, year
 *            note: tick implies a multipier of 1
 * speed: object with property seconds (framerate) and optional interval
 *
 * options = {
 *   annotations: [ {
 *      title,
 *      content,
 *      the_geom,
 *      start_time,
 *      end_time,
 *      in_timeline,
 *      in_map,
 *      appearance
 *      } ... ],
 *   map: ol.Map,
 *   boxes : [ {
 *      range : {
 *          start, end
 *      },
 *      center: ol.Coordinate,
 *      resolution: float,
 *      static: boolean,
 *      speed: { interval, seconds }
 *      } ... ],
 *   data : [ date ...] | rangeWithInterval,
 *   playback : {
 *      mode: instant | range | cumulative,
 *      fixed: boolean
 *   },
 *   timeLineId : element id,
 *   timeSliderId : element id,
 *   controlsId: element id
 *
 * }
 */
export default function create(options) {
  // @todo for layers, annotations won't exist and, intially, we won't
  //       have playback settings for layers...
  let model,
    annotations = new Annotations(options.annotations),
    boxes = options.boxes,
    controls = {"getChapterCount": options.getChapterCount, "nextChapter": options.nextChapter},
    totalRange,
    slider,
    timeline,
    mapController;
  options.boxy = new Boxes(options.boxes);
  // make a default box if none provided
  if (typeof boxes === "undefined" || boxes.length === 0) {
    let interval = 0, data = null;
    if (Array.isArray(options.data)) {
      data = options.data;
      totalRange = computeRange(options.data);
    } else {
      interval = options.data.interval || pickInterval(options.data);
      totalRange = options.data;
    }
    boxes = [{
      data,
      range: totalRange,
      speed: {
        interval,
        seconds: 3
      }
    }];
  }

  model = new TimeModel(options, boxes, annotations);
  slider = new TimeSlider(options.timeSliderId || "slider", model);
  timeline = new TimeLine(options.timeLineId || "timeline", model);

  const timeControls = new TimeController(model, slider, timeline, controls);
  mapController = new MapController(options, timeControls);
  return timeControls;
}