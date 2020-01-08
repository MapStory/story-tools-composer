export default {
  generateUUID: () => {
    /* eslint-disable no-bitwise, eqeqeq */
    let d = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = ((d + Math.random() * 16) % 16) | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
    /* eslint-enable no-bitwise, eqeqeq */
  },
  getReadableTimestamp: () => {
    function formatAMPM(date) {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours %= 12;
      hours = hours || 12;
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      const strTime = `${hours}:${minutes} ${ampm}`;
      return strTime;
    }
    const today = new Date();
    const date = `${today.getMonth() +
      1}/${today.getDate()}/${today.getFullYear()}`;
    const datetime = `${date} ${formatAMPM(today)}`;
    return datetime;
  },
  getUseProxyParam: server => {
    return goog.isDefAndNotNull(server.use_proxy) ? server.use_proxy : false;
  },
  useProxyUrlParam: (use_proxy, url, proxy = "/proxy/?url=") => {
    if (goog.isDefAndNotNull(use_proxy) && goog.isDefAndNotNull(proxy)
        && use_proxy === true) {
      url = decodeURIComponent(url);
      if (url.indexOf(proxy) < 0) {
        url = proxy + encodeURIComponent(url);
      } else {
        url = encodeURIComponent(url);
      }
    }
    return url;
  }
};
