/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import noUiSlider from "nouislider";
import {Events} from "./utils";

/**
 * Visual feedback of complete story line. Allow dragging of range, click
 * to position.
 *
 * Playback Modes
 * - fixed cumulative (min fixed at 0, max adjusts with tick)
 * - fixed range playback (range fixed, window adjusts with tick)
 * - fixed instant (like fixed range but range of 0)
 * - open range playback (fully adjustable min/max, window adjusts with tick)
 *
 * Internal model
 * - 0-N where N is either the number of instants or the total number of extents
 *
 * @param {type} id
 * @param {type} model
 * @returns {TimeSlider}
 */
export default function TimeSlider(id, model) {
  const slider = $(`#${  id}`)[0];
  const events = new Events();
  let initialized = false;
  let singleSlider;


  function getSliderRangeInternal() {
    let range = slider.noUiSlider.get();
    if (! Array.isArray(range)) {
      range = parseInt(range, 10);
      range = [model.mode === "cumulative" ? 0 : range, range];
    } else {
      range = range.map((i) => parseInt(i, 10));
    }
    return range;
  }

  function getRange() {
    const range = getSliderRangeInternal();
    return model.getRangeAt(range[0], range[1]);
  }

  function init(model) {
    const options = {
      step: 1,
      start: [0, 0],
      animate: false,
      connect: true,
      range: {
        min: 0,
        max: model.getSteps() - 1
      },
      behaviour: "drag-snap"
    };
    singleSlider = false;

    /* if (model.fixed) {
            // @todo need model interval
        } */

    if (model.mode === "cumulative") {
      singleSlider = true;
      options.connect = "lower";
    } else if (model.mode === "instant") {
      singleSlider = true;
      options.connect = false;
    } else if (model.mode === "range") {
      if (model.fixed) {
        // ideally we'd support snap but it breaks fixed
        options.behaviour = "drag-fixed";
      }
    } else {
      throw new Error(`invalid model mode : ${  model.mode}`);
    }

    if (initialized) {
      // have to update values based on current state
      const range = getSliderRangeInternal();
      if (singleSlider) {
        options.start = range[0];
      } else {
        if (range[0] === range[1]) {
          range[1] += 1;
        }
        options.start = range;
      }
    } else if (singleSlider) {
      options.start = 0;
    }

    if (!initialized) {
      if(slider)
      {
        noUiSlider.create(slider, options);
        slider.noUiSlider.on("slide", () => {
          const range = getRange();
          events.event("rangeChanged").publish(range);
        });
        initialized = true;
      }
    } else {
      options.range = {
        min: 0,
        max: model.getSteps() - 1
      };
      slider.noUiSlider.updateOptions(options, true);
    }

  }

  init(model);

  function width() {
    const range = getSliderRangeInternal();
    return range[1] - range[0];
  }

  function isAtEnd(left) {
    const range = getSliderRangeInternal();
    if (left) {
      return range[0] === 0;
    }
    return range[1] === model.getSteps()-1;
  }

  function setValue(val) {
    // normalize nouislider.val to handle array
    if (singleSlider) {
      slider.noUiSlider.set(val[1]);
    } else {
      slider.noUiSlider.set(val);
    }
  }

  this.slider = slider;
  this.on = function on(event, fn) {
    if(initialized) {
      events.event(event).subscribe(fn);
    }
  };
  this.getSliderRangeInternal = getSliderRangeInternal;
  this.center = function center(index) {
    const half = Math.floor(width() / 2);
    setValue([index - half, index + half]);
  };
  this.move = function move(amt) {
    const vals  = getSliderRangeInternal();
    vals[0] += amt;
    vals[1] += amt;
    setValue(vals);
    return isAtEnd(amt < 0);
  };
  this.grow = function grow(amt) {
    const vals = getSliderRangeInternal();
    vals[1] += amt;
    setValue(vals);
    return isAtEnd(false);
  };
  this.growTo = function growTo(where) {
    const vals = getSliderRangeInternal();
    vals[1] = where;
    setValue(vals);
    return isAtEnd(false);
  };
  this.jump = function jump(to) {
    setValue([to, to + width()]);
  };
  this.getRange = getRange;
  this.update = init;
};
