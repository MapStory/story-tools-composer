import moment from "moment";
import {getTime, computeRange, isRangeLike, createRange} from "./core/utils";


/**
   * Compute a sorted, unique array of ticks for the provided layers. The
   * algorithm uses any provided instant or extent(start value used) list values
   * and looks at the total range of all interval values creating a tick at the
   * minimum interval for the total range. See the tests for examples.
   * @param {array|ol.Map} layersWithTime
   * @returns array of ticks
   */
const lastComputedTicks = {ticks: []};

function computeTicks(layersWithTime, storyPins) {
  // allow a map to be passed in
  if (!angular.isArray(layersWithTime)) {
    const storyMap = layersWithTime;
    layersWithTime = storyMap.getStoryLayers().getArray().filter((l) => {
      const times = l.get("times");
      /* jshint eqnull:true */
      return times != null;
    });
    layersWithTime.push(storyMap.storyPinsLayer);
    layersWithTime.push(storyMap.storyBoxesLayer);
  }

  let ticks = {};
  let totalRange = null;
  const intervals = [];
  function addTick(add) {
    add = getTime(add);
    if (add !== null && ! (add in ticks)) {
      ticks[add] = 1;
    }
  }
  if (storyPins) {
    storyPins.forEach((pin) => {
      addTick(+moment(pin.startTime));
    });
  }
  layersWithTime.forEach((l) => {
    const times = l.get("times");
    let range;
    if (angular.isArray(times)) {
      // an array of instants or extents
      range = computeRange(times);

      if (times.length) {
        if (isRangeLike(times[0])) {
          times.forEach((r) => {
            addTick(r.start);
            if (totalRange === null) {
              totalRange = createRange(r);
            } else {
              totalRange.extend(r);
            }
          });
        } else {
          times.forEach((r) => {
            addTick(r);
          });
        }
      }
      // add a tick at the end to ensure we get there
      /* jshint eqnull:true */
      if (range.end != null) {
        addTick(range.end);
      }
    } else if (times) {
      // a interval (range+duration)
      range = times;
      intervals.push(times);
    }
    if (totalRange === null) {
      // copy, will be modifying
      totalRange = createRange(range);
    } else {
      totalRange.extend(range);
    }
  });
  if (intervals.length) {
    intervals.sort((a, b) => a.interval - b.interval);
    const smallest = intervals[0];
    let start = totalRange.start;
    while (start <= totalRange.end) {
      addTick(start);
      start = smallest.offset(start);
    }
  }
  ticks = Object.getOwnPropertyNames(ticks).map((t) => parseInt(t));

  lastComputedTicks.ticks = ticks.sort((a, b) => a - b);

  // The range slider can't handle when the min/max is the same,
  // so if there's only one tick, we don't show it
  if (lastComputedTicks.ticks.length === 1) {
    return [];
  }

  return lastComputedTicks.ticks;
}

function TimeControlsManager($log, $rootScope, StoryPinLayerManager, MapManager, pinSvc) {
  this.timeControls = null;
  const timeControlsManager = this;

  function maybeCreateTimeControls(update) {
    if (timeControlsManager.timeControls !== null) {
      if (update) {
        const values = update();
        if (values) {
          timeControlsManager.timeControls.update(values);
        }
      }
      return;
    }
    const range = computeTicks(MapManager.storyMap, pinSvc.getCurrentPins());
    if (range.length) {
      const annotations = pinSvc.getCurrentPins();
      timeControlsManager.timeControls = storytools.core.time.create({
        annotations,
        storyMap: MapManager.storyMap,
        storyLayers: MapManager.storyMap.getStoryLayers().getArray(),
        data: range,
        mode: MapManager.storyMap.mode,
        tileStatusCallback(remaining) {
          $rootScope.$broadcast("tilesLoaded", remaining);
        },
        getChapterCount: MapManager.getChapterCount,
        nextChapter: MapManager.navigationSvc.nextChapter

      });
      timeControlsManager.timeControls.on("rangeChange", (range) => {
        timeControlsManager.currentRange = range;
        $rootScope.$broadcast("rangeChange", range);
      });
    }
  }

  MapManager.storyMap.getStoryLayers().on("change:length", () => {
    maybeCreateTimeControls(() => {
      const range = computeTicks(MapManager.storyMap, pinSvc.getCurrentPins());
      if (range.length >= 0) {
        return {
          storyLayers: MapManager.storyMap.getStoryLayers().getArray(),
          data: range
        };
      }
    });
  });
  const pinsLayer = MapManager.storyMap.storyPinsLayer;
  const boxesLayer = MapManager.storyMap.storyBoxesLayer;

  const pinLayerChange = () => {
    maybeCreateTimeControls(() => {
      const range = computeTicks(MapManager.storyMap, pinSvc.getCurrentPins());
      if (range.length >= 0) {
        return {
          annotations: pinsLayer.get("features"),
          data: range
        };
      }
    });
  };
  pinsLayer.on("change:features", pinLayerChange);
  window.PubSub.subscribe("pinAdded", pinLayerChange);

  boxesLayer.on("change:features", () => {
    maybeCreateTimeControls(() => {
      const range = computeTicks(MapManager.storyMap, pinSvc.getCurrentPins());
      if (range.length >= 0) {
        return {
          boxes: boxesLayer.get("features"),
          data: range
        };
      }
    });
  });

  maybeCreateTimeControls();
}


export {TimeControlsManager}
export function TimeMachine() {
  return {
    computeTicks,
    lastComputedTicks
  }
}
