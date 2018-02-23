function timeSvc() {
  const svc = {};

  var parseDate = function(str) {
    var date;
    var dateRegEx = /^(-?)(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:(?:T(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(?:[+-]\d{1,2}(?::(\d{2}))?)))|Z)?$/;
    var match = str.match(dateRegEx);
    if (match && (match[2] || match[8])) { // must have at least year or time
      var year = parseInt(match[2], 10) || 0;
      if (match[1]){
        year = year * -1;
      }
      var month = (parseInt(match[3], 10) - 1) || 0;
      var day = parseInt(match[4], 10) || 1;
      date = new Date(Date.UTC(year, month, day));
      // optional time
      var type = match[8];
      if (type) {
        var hours = parseInt(match[5], 10);
        var minutes = parseInt(match[6], 10);
        var secFrac = parseFloat(match[7]);
        var seconds = secFrac | 0;
        var milliseconds = Math.round(1000 * (secFrac - seconds));
        date.setUTCHours(hours, minutes, seconds, milliseconds);
        // check offset
        if (type !== "Z") {
          var hoursOffset = parseInt(type, 10);
          var minutesOffset = parseInt(match[9], 10) || 0;
          var offset = -1000 * (60 * (hoursOffset * 60) + minutesOffset * 60);
          date = new Date(date.getTime() + offset);
        }
      }
    } else {
      date = new Date("invalid");
    }
    return date;
  };

  svc.getTime = arg => {
      const type = typeof arg;
      if (type === 'number') {
          return arg;
      }
      if (arg instanceof Date) {
          return arg.getTime();
      }
      if (type === 'string') {
          return parseDate(arg).getTime();
      }
      /*jshint eqnull:true */
      if (arg == null) {
          return null;
      }
      if (isRangeLike(arg)) {
          /*jshint eqnull:true */
          return getTime(arg.start != null ? arg.start : arg.end);
      }
      throw new Error(`cannot call getTime with ${type}, : ${arg}`);
  };

  return svc;
}

module.exports = timeSvc;
