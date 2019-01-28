/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import jQuery from "jquery";
import moment from "moment";


/**
 * The regex to be used for validating dates. You can provide your own
 * regex for instance for adding support for years before BC. Default
 * value is: /^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:(?:T(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(?:[+-]\d{1,2}(?::(\d{2}))?)))|Z)?$/
 */
const dateRegEx = /^(-?)(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:(?:T(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(?:[+-]\d{1,2}(?::(\d{2}))?)))|Z)?$/;


/**
 * Generate a date object from a string.  The format for the string follows
 *     the profile of ISO 8601 for date and time on the Internet (see
 *     http://tools.ietf.org/html/rfc3339).  We don't call the native
 *     Date.parse because of inconsistency between implmentations.  In
 *     Chrome, calling Date.parse with a string that doesn't contain any
 *     indication of the timezone (e.g. "2011"), the date is interpreted
 *     in local time.  On Firefox, the assumption is UTC.
 *
 * Parameters:
 * str - {String} A string representing the date (e.g.
 *     "2010", "2010-08", "2010-08-07", "2010-08-07T16:58:23.123Z",
 *     "2010-08-07T11:58:23.123-06", "-3000-08-07T16:58:23.123Z").
 *
 * Returns:
 * {Date} A date object.  If the string could not be parsed, an invalid
 *     date is returned (i.e. isNaN(date.getTime())).
 */
export function parseDate(str) {
  let date;
  const match = str.match(dateRegEx);
  if (match && (match[2] || match[8])) { // must have at least year or time
    let year = parseInt(match[2], 10) || 0;
    if (match[1]){
      year *= -1;
    }
    const month = (parseInt(match[3], 10) - 1) || 0;
    const day = parseInt(match[4], 10) || 1;
    date = new Date(Date.UTC(year, month, day));
    // optional time
    const type = match[8];
    if (type) {
      const hours = parseInt(match[5], 10);
      const minutes = parseInt(match[6], 10);
      const secFrac = parseFloat(match[7]);
      const seconds = secFrac | 0;
      const milliseconds = Math.round(1000 * (secFrac - seconds));
      date.setUTCHours(hours, minutes, seconds, milliseconds);
      // check offset
      if (type !== "Z") {
        const hoursOffset = parseInt(type, 10);
        const minutesOffset = parseInt(match[9], 10) || 0;
        const offset = -1000 * (60 * (hoursOffset * 60) + minutesOffset * 60);
        date = new Date(date.getTime() + offset);
      }
    }
  } else {
    date = new Date("invalid");
  }
  return date;
}


export function isRangeLike(object) {
  return object !== null && object !== undefined && ((object.start !== null && object.start !== undefined) || (object.end !== null && object.end !== undefined));
}

/**
 * Get the number of milliseconds from the provided arg.
 * @param arg - either Date, range (returns start), string or number
 * @returns milliseconds or null if nothing provided
 */
export function getTime(arg) {
  const type = typeof arg;
  if (type === "number") {
    return arg;
  }
  if (arg instanceof Date) {
    return arg.getTime();
  }
  if (type === "string") {
    return parseDate(arg).getTime();
  }
  /* jshint eqnull:true */
  if (arg == null) {
    return null;
  }
  if (isRangeLike(arg)) {
    /* jshint eqnull:true */
    return getTime(arg.start != null ? arg.start : arg.end);
  }
  throw new Error(`cannot call getTime with ${  type  }, : ${  arg}`);
}

export const formatTimelineDate = datetime => moment(datetime).format("llll");

function Range(start, end) {
  if (Number.isNaN(Number(start)) || Number.isNaN(Number(end))) {
    throw new Error("invalid start and/or end");
  }
  this.start = start;
  this.end = end;
}

export function createRange(start, end) {
  if (arguments.length === 1) {
    const other = start;
    if (isRangeLike(other)) {
      start = other.start;
      end = other.end;
    } else {
      end = start;
    }
  }
  /* jshint eqnull:true */
  if (start != null && end != null && start > end) {
    throw new Error("start > end");
  }
  return new Range(getTime(start), getTime(end));
}

export function rangesEqual(a, b) {
  return getTime(a.start) === getTime(b.start) &&
    getTime(a.end) === getTime(b.end);
}

function rangeContains(range, time) {
  /* jshint eqnull:true */
  if (time == null) {
    throw new Error("invalid time argument");
  }
  /* jshint eqnull:true */
  return ((range.start != null ? time >= range.start : true) &&
    (range.end != null ? time < range.end : true)) ||
    range.start === range.end && time === range.start;
}

export function parseISODuration(duration) {
  const values = exports.isoDurationToMoment(duration);
  return moment.duration(values).asMilliseconds();
}

export function Interval(start, end, duration) {
  if (typeof start === "object") {
    const opts = start;
    start = opts.start;
    end = opts.end;
    duration = opts.duration;
  }
  if (start === end) {
    throw new Error("interval should have width");
  }
  Range.call(this, start, end);
  this.duration = duration;
  this.interval = exports.parseISODuration(this.duration);
  this.offset = exports.createOffsetter(this);
}

/**
 * extend this Range by another. This algorithm will consider an open-ended
 * range to represent a minimum of start and maximum of end.
 * @param {type} other
 * @returns {undefined}
 */
Range.prototype.extend = function extend(other) {
  /* jshint eqnull:true */
  if (!isRangeLike(other)) {
    other = exports.createRange(other);
  }
  let start = getTime(other.start);
  let end = getTime(other.end);
  if (start == null) {
    start = end;
  }
  if (end == null) {
    end = start;
  }
  if (start != null) {
    if (this.start == null) {
      this.start = start;
    } else {
      this.start = Math.min(this.start, start);
    }
  }
  if (end != null) {
    if (this.end == null) {
      this.end = end;
    } else {
      this.end = Math.max(this.end, end);
    }
  }
};
Range.prototype.intersects = function intersects(other) {
  if (isRangeLike(other)) {
    /* jshint eqnull:true */
    const es = other.start == null ? Number.MIN_VALUE : other.start;
    const ee = other.end == null ? Number.MAX_VALUE : other.end;
    // intersection if (any)
    // effective end in this range
    // effective start in this range
    // effective start before and effective end after
    return rangeContains(this, es) ||
      rangeContains(this, ee) ||
      es <= this.start && ee >= this.end;
  }
  return rangeContains(this, getTime(other));

};
Range.prototype.toString = function toString() {
  return `${new Date(this.start).toUTCString()  } : ${  new Date(this.end).toUTCString()}`;
};
Range.prototype.center = function center() {
  return Math.floor(this.start + (this.end - this.start) / 2);
};
Range.prototype.width = function width() {
  return this.end - this.start;
};
Range.prototype.isEmpty = function isEmpty() {
  /* jshint eqnull:true */
  return this.end == null && this.start == null;
};
export { Range };



/**
 * Compute the overall range of provided args. Args may be an array of:
 * date or long, range, object with property/function yielding range for the
 * object.
 * @param {type} args
 * @returns range will have start/end even if the same time.
 */
export function computeRange(args, rangeGetter) {
  const range = new Range(null, null);
  exports.visitRanges(args, rangeGetter, (arg, r) => {
    range.extend(r);
  });
  /* jshint eqnull:true */
  if (range.start == null) {
    range.start = range.end;
  }
  if (range.end == null) {
    range.end = range.start;
  }
  return range;
}

export function visitRanges(objects, rangeGetter, visitor) {
  let getRange;
  if (typeof rangeGetter === "string") {
    getRange = (object) => object[rangeGetter];
  } else if (typeof rangeGetter === "function") {
    getRange = rangeGetter;
  } else {
    getRange = (object) => isRangeLike(object) ? object : exports.createRange(object);
  }
  for (let i = 0, ii = objects.length; i < ii; i++) {
    const object = objects[i];
    visitor(object, getRange(object));
  }
}

/** for the given what, find the index in the items that what is closest
 * to. items must be sorted. The lowest closest value possible is returned.
 */
export function binarySearch(items, what) {
  const start = 0;
  let stop = items.length - 1;
  let mid = stop + start / 2 | 0;
  let val;
  if (what < items[0]) {
    return 0;
  }
  if (what > items[stop]) {
    return items.length - 1;
  }
  while ((items[mid]) !== what && start < stop) {
    val = items[mid];
    if (what > val) {
      if (what < items[mid + 1]) {
        return mid;
      }
    } else if (what < val) {
      if (what > items[mid - 1]) {
        return mid - 1;
      }
      stop = mid - 1;
    }
    mid = stop + start / 2 | 0;
  }
  return mid;
}

export function find(items, what) {
  if (what < items[0]) {
    return 0;
  }
  for (let i = 0, ii = items.length - 1; i < ii; i++) {
    if (what >= items[i] && what < items[i + 1]) {
      return i;
    }
  }
  return items.length - 1;
};

export function Events() {
  const topics = {};

  // @todo introduce setting topics with arguments and logging/exception
  // on un-fired event

  function event(id) {
    let callbacks,
      topic = id && topics[ id ];
    if (!topic) {
      callbacks = jQuery.Callbacks();
      topic = {
        publish: callbacks.fire,
        subscribe: callbacks.add,
        unsubscribe: callbacks.remove
      };
      if (id) {
        topics[ id ] = topic;
      }
    }
    return topic;
  }

  return {
    event
  };
}

export function pickInterval(range) {
  const intervals = [
    moment.duration(1, "seconds").asMilliseconds(),
    moment.duration(1, "minutes").asMilliseconds(),
    moment.duration(1, "hours").asMilliseconds(),
    moment.duration(1, "days").asMilliseconds(),
    moment.duration(1, "weeks").asMilliseconds(),
    moment.duration(1, "months").asMilliseconds(),
    moment.duration(1, "years").asMilliseconds()
  ];
  return intervals[Math.max(exports.find(intervals, range.width()) - 1, 0)];
}


