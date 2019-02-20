/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */
import {BoxModel} from "./boxes";

/**
 * @todo document me
 */
export default function TimeModel(options, boxes, annotations) {
    
  const boxModel = new BoxModel(boxes);

  this.annotations = annotations;
  this.boxes = boxes;
  this.boxy = options.boxy;
  this.storyLayers = [];
  this.storyPins = [];
  this.fixed = false;
  this.mode = "instant";
  this.interval = 1000;

  const propertyExists = (obj, prop) => Object.keys(obj).includes(prop);

  function init(opts) {
    if (propertyExists(opts, "fixed")) {
      this.fixed = opts.fixed;
    }

    if (propertyExists(opts, "speed") && opts.speed !== undefined) {
      this.interval = opts.speed;
    }

    if (propertyExists(opts, "mode") && opts.mode !== undefined) {
      this.mode = opts.mode;
    }
    if (propertyExists(opts, "annotations")) {
      this.annotations.update(opts.annotations);
    }
    if (propertyExists(opts, "boxes")) {
      this.boxy.update(opts.boxes);
    }

    if (propertyExists(opts, "storyLayers")) {
      this.storyLayers = opts.storyLayers;
    }

    // @todo is the best name for this
    if (propertyExists(opts, "data")) {
      boxModel.setRange(opts.data);
    }
  }

  init.call(this, options);
  this.getRange = function getRange() {
    return boxModel.getRange();
  };
  this.getTotalRange = function getTotalRange() {
    // @todo need to access layers and cached dimension data
    //       and consider annotations?
    throw Error("not implemented");
  };
  this.update = init;
  this.getSteps = function getSteps() {
    return boxModel.getSteps();
  };
  this.getIndex = function getIndex(instant) {
    return boxModel.getIndex(instant);
  };
  this.getRangeAt = function getRangeAt(i, j) {
    return boxModel.getRangeAt(i, j);
  };
};
