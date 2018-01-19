function timeSvc() {
  const svc = {};

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
