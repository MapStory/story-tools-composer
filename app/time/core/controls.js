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

  const self = this,
    events = new Events();

  function getTimelineWindow() {
    return createRange(timeline.getWindow());
  }



  function publish(event, data) {
    events.event(event).publish(data);
    // For some reason, importing PubSub normally
    // doesn't allow listeners in composer to listen to these events
    window.PubSub.publish(event, {loop: self.loop, data});
  }

  let currentTimelineWindow = getTimelineWindow(),
    isAdjusting = false,
    started = false,
    timeout = null,
    deferred = [];


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


  function publishRangeChange(data) {
    if (typeof data === "undefined") {
      data = slider.getRange();
    }
    publish("rangeChange", data);
  }

  function centerTimeline(range) {
    const c = model.mode === "cumulative" ? range.end : range.center();
    timeline.moveTo(c);
    publishRangeChange(range);
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
        slider.jump(0);
        controls.nextChapter();
      } else {
        self.stop();
      }
    }
    centerTimeline(slider.getRange());
    if (started) {
      // eslint-disable-next-line no-use-before-define
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
      }, () => {
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

  function clearTimeout() {
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    timeout = null;
  }


  slider.on("rangeChanged", (range) => {
    clearTimeout();
    adjust(centerTimeline, range);
    schedule();
  });
  timeline.on("rangechanged", (range) => {
    adjust(updateSlider, range);
  });

  function publishStateChange(state) {
    publish("stateChange", state);
  }

  function run() {
    publishStateChange("running");
    move(1);
  }

  this.defer = function deferFunc(defer) {
    deferred.push(defer);
  };
  this.getCurrentRange = function getCurrentRange() {
    return slider.getRange();
  };
  this.update = function update(options) {
    model.update(options);
    slider.update(model);
    timeline.update(model);
    window.setTimeout(publishRangeChange, 0);
  };
  this.start = function start() {
    if (started) {
      return;
    }
    deferred = [];
    started = true;
    window.setTimeout(run, 0);
  };
  this.stop = function stop() {
    deferred = [];
    started = false;
    clearTimeout();
    window.setTimeout(publishStateChange, 0, "stopped");
  };
  this.next = function next() {
    clearTimeout();
    window.setTimeout(move, 0, 1);
  };
  this.prev = function prev() {
    clearTimeout();
    window.setTimeout(move, 0, -1);
  };
  this.isStarted = function isStarted() {
    return started;
  };
  this.isReady = function isReady() {
    const r = model.getRange();
    return r.start !== null && r.end !== null;
  };
  this.on = function on(event, f) {
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
  this.getTimeLineAnnotatons = function getTimeLineAnnotations() {
    return inTimeline(true);
  };
  this.update = function update(newAnnotations) {
    this.ann = newAnnotations;
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
  this.getTimeLineBoxes = function getTimeLineBoxes() {
    return inTimeline(true);
  };
  this.update = function update(newBoxes) {
    this.box = newBoxes;
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

  const
    annotations = new Annotations(options.annotations),
    controls = {"getChapterCount": options.getChapterCount, "nextChapter": options.nextChapter};

  let
    totalRange,
    boxes = options.boxes;

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

  const model = new TimeModel(options, boxes, annotations);
  const slider = new TimeSlider(options.timeSliderId || "slider", model);
  const timeline = new TimeLine(options.timeLineId || "timeline", model);

  const timeControls = new TimeController(model, slider, timeline, controls);

  // eslint-disable-next-line no-new
  new MapController(options, timeControls);
  return timeControls;
}
