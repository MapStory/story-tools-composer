function timeSvc() {
  const svc = {};

  const parseDate = str => {
    let date;
    const dateRegEx = /^(-?)(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:(?:T(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(?:[+-]\d{1,2}(?::(\d{2}))?)))|Z)?$/;
    const match = str.match(dateRegEx);
    if (match && (match[2] || match[8])) {
      // must have at least year or time
      let year = parseInt(match[2], 10) || 0;
      if (match[1]) {
        year *= -1;
      }
      const month = parseInt(match[3], 10) - 1 || 0;
      const day = parseInt(match[4], 10) || 1;
      date = new Date(Date.UTC(year, month, day));
      // optional time
      const type = match[8];
      if (type) {
        const hours = parseInt(match[5], 10);
        const minutes = parseInt(match[6], 10);
        const secFrac = parseFloat(match[7]);
        const seconds = secFrac || 0;
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
  };

  svc.getTime = arg => {
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
    throw new Error(`cannot call getTime with ${type}, : ${arg}`);
  };

  return svc;
}

export default timeSvc;
