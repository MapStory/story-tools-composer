/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */
import {isRangeLike, createRange, find, computeRange} from "./utils";

function Box(options) {
  this.range = options.range || null;
  this.data = options.data || null;
  this.layerIds = options.layerIds || null;
  this.center = options.center || null; // ol.Coordinate
  this.resolution = options.resolution || null;
  this.allowPan = options.allowPan;
  this.allowZoom = options.allowZoom;
  this.speed = options.speed;  // interval, seconds
  this.title = options.title || "";
  this.id = options.id || new Date().getUTCMilliseconds();
  this.zoom = options.zoom || null;
  this._offset = 0;
  if (this.range === null) {
    if(this.data) {
      this.range = createRange(this.data[0], this.data[this.data.length - 1]);
    }else{
      this.range = createRange(options.start_time, options.end_time);
    }
  }
  // @todo possible divide by zero if speed.interval not set!
  this._steps = this.data === null ? Math.floor(this.range.width() / this.speed.interval) + 1: this.data.length;
}
Box.prototype.getSteps = function getSteps() {
  return this._steps;
};
Box.prototype.getRange = function getRange() {
  return this.range;
};
Box.prototype.getIndex = function getIndex(instant) {
  return this.data ? find(this.data, instant) :
    Math.floor(Math.min(this.range.width(), Math.max(0, instant - this.range.start)) / this.speed.interval);
};
Box.prototype.getDate = function getDate(idx) {
  idx -= this._offset;
  const retValue = this.data ? this.data[idx] : this.range.start + (idx * this.speed.interval);
  return retValue;
};


function getTime(props, prop) {
  let val = props[prop];
  if (typeof val !== "undefined") {
    val *= 1000;
    return val;
  }
  return null;
}

/**
 * Load Box from geojson, reprojecting from 4326 to the provided
 * projection.
 * @param {Object} geojson
 * @param {String} projection
 * @returns array of Box features
 */
function loadFromGeoJSON(geojson, projection) {
  if (projection) {
    projection = ol.proj.get(projection);
  }
  return geojson.features.map((f) => {
    const props = f.properties;
    // props.the_geom = f.geometry;
    props.id = f.id;
    props.start_time = getTime(props, "start_time");
    props.end_time = getTime(props, "end_time");
    return new Box(props, projection);
  });
}

function findBox(boxes, idx) {
  let i, ii;
  let box;
  for (i = 0, ii = boxes.length; i < ii; i++) {
    box = boxes[i];
    if (idx >= box._offset) {
      if (i + 1 < ii) {
        if (idx < boxes[i + 1]._offset) {
          break;
        }
      } else {
        break;
      }
    }
  }
  return box;
}

function BoxModel(boxArray) {
  let boxes,
    range,
    steps;
  function updateBoxes(neu) {
    let offset = 0;
    boxes = neu.map((b) => {
      const box = new Box(b);
      box._offset = offset;
      offset += box.getSteps();
      return box;
    });
    range = computeRange(boxes, "range");
    steps = offset;
  }
  updateBoxes(boxArray);
  this.getRange = function getRange() {
    return range;
  };
  this.getSteps = function getSteps() {
    return steps;
  };
  this.getRangeAt = function getRangeAt(s, e) {
    const start = findBox(boxes, s);
    const end = findBox(boxes, e);
    return createRange(start.getDate(s), end.getDate(e));
  };
  this.getIndex = function getIndex(instant) {
    let idx = 0, i;
    if (instant < boxes[0].getRange().start) {
      return 0;
    }
    for (i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const range = box.getRange();
      if (instant >= range.start && instant <= range.end) {
        idx += box.getIndex(instant);
        break;
      } else {
        idx += box.getSteps();
      }
    }
    return idx;
  };
  this.setRange = function setRange(newRange) {
    if (boxes.length === 1) {
      // @todo support for range
      if (isRangeLike(newRange)) {
        throw new Error("not supported yet");
      }
      boxes[0].data = newRange;
      // @todo must set here or constructor is dumb and doesn't recompute
      boxes[0].range = computeRange(newRange);
    } else {
      // @todo finish
    }
    updateBoxes(boxes);
  };
  this.update = function update(options) {

  };
}


export {Box, getTime, loadFromGeoJSON, findBox, BoxModel}
