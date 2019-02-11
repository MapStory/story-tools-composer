/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import moment from "moment";
import vis from "vis/dist/vis.min.js";
import {createRange, rangesEqual} from "./utils";
import sha1 from "../../utils/sha1";

const Timeline = vis.Timeline;

/**
 * Display annotations or other temporal instant/extent. Allow adjusting
 * time (either instant or extent) by dragging.
 * @param {type} id
 * @param {type} model
 * @returns {_L1.TimeLine}
 */
export default function TimeLine(id, model) {
  const dom = $(`#${  id}`);
  let timeline = null;
  // @revisit - internally the timeline seems to apply the offset when
  //            creating a tool tip, does this cause problems elsewhere?
  const offset = new Date().getTimezoneOffset() * 60 * 1000;

  function init(model) {
    let elements = [], layer_groups = [], groups = [];
    const story_pin_label = "Annotation";
    let range = model.getRange();
    if (range.isEmpty()) {
      range = createRange(Date.now());
    }
    if (model.annotations.ann) {
      elements = model.annotations.ann.map((ann, i) => {
        /* jshint eqnull:true */
        let start = ann.startTime != null ? ann.startTime : range.start;
        let end = ann.endTime != null ? ann.endTime : range.end;
        start = +moment(start);
        end = +moment(end);
        const type = start === end ? "box" : "range";
        return {
          id: sha1(`annotation${  ann.id  }${i}`),
          start,
          end,
          content: ann.content || ann.title,
          title: ann.title,
          type,
          group: story_pin_label
        };
      });
    }

    // Add the Group if there are elements.
    if(elements.length > 0){
      groups = elements;
    }

    if (model.boxy.box) {
      const box_elements = model.boxy.box.map((box, i) => {
        /* jshint eqnull:true */
        const start = box.range != null ? box.range.start : range.start;
        const end = box.range != null ? box.range.end : range.end;
        const type = "background";
        return {
          id: sha1(`box${  box.id}`),
          start,
          end,
          content: box.content || box.title,
          type
        };
      });
      elements = elements.concat(box_elements);
    }


    layer_groups = $.map(model.storyLayers, (lyr, i) => {
      const id = lyr.get("id");
      const title = lyr.get("title");
      const times = lyr.get("times") || [];
      let group = null;

      if (times.length > 0) {
        if (times.length > 1500) {
          elements.push({
            id: sha1(id),
            group: id,
            content: "",
            start: times[0],
            end: times[times.length - 1],
            type: "range"
          });
        } else {
          for (let j = 0; j < times.length; j++) {
            const time = times[j];
            elements.push({
              id: sha1(id + time + Date()),
              group: id,
              content: "",
              start: time,
              type: "box"
            });
          }
        }
        group = {
          id,
          content: title
        };

      }
      return group;
    });

    groups = groups.concat(layer_groups);

    if(elements.length > 5000){
      elements = [];
    }

    const height = $( document ).height() * 0.35;

    const options = {
      min: range.start,
      max: range.end,
      start: range.start,
      end: range.end,
      height: (height < 300)? 138: height,
      maxHeight: 400,
      showCurrentTime: false
    };
    if (timeline === null) {
      timeline = new Timeline(dom.get(0), elements, options);
      timeline.setGroups(groups);
      timeline.setCurrentTime(range.start);
      timeline.addCustomTime();
    } else {
      timeline.setOptions(options);
      timeline.setItems(elements);
      timeline.setGroups(groups);
    }
  }
  init(model);

  // updates from user dragging customtime bar
  // @todo will not update slider currently at min timeline zoom as it
  // is difficult to determine whether an event is from zooming or dragging
  // need to wrap event handling to better differentiate
  timeline.on("timechanged", () => {
    timeline.moveTo(timeline.getCustomTime(), {animate: false});
  });
  this.moveTo = function moveTo(time) {
    timeline.moveTo(time, {animate: false});

    if (window.storypinCallback) {
      window.storypinCallback(time);
    }

    if (window.frameCallback) {
      window.frameCallback(time);
    }
  };
  this.setTime = function setTime(time) {
    timeline.setCustomTime(time + offset);
  };
  this.isWindowMax = function isWindowMax() {
    return rangesEqual(timeline.getWindow(), model.getRange());
  };
  this.moveToCurrentTime = function moveToCurrentTime() {
    const current = timeline.getCustomTime().getTime();
    const width = createRange(timeline.getWindow()).width();
    const range = model.getRange();
    if (current === range.start) {
      timeline.setWindow(range.start, range.start + width, {animate: false});
    } else if (current === range.end) {
      timeline.setWindow(range.end - width, range.end, {animate: false});
    } else {
      timeline.moveTo(current, {animate: false});
    }
  };
  this.getWindow = function getWindow() {
    return timeline.getWindow();
  };
  this.on = function on(ev, cb) {
    timeline.on(ev, cb);
  };
  this.update = init;
  // @todo detect click or dblclick event and position based on % of total width
}
