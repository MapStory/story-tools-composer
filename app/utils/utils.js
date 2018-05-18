function utils() {
  const svc = {};
  Array.prototype.move = function(old_index, new_index) {
    if (new_index >= this.length) {
      let k = new_index - this.length;
      while (k-=1 + 1) {
        this.push(undefined);
      }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
  };

  svc.generateUUID = () => {
    /* eslint-disable no-bitwise, eqeqeq */
    let d = new Date().getTime();
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (
      c
    ) => {
      const r = ((d + Math.random() * 16) % 16) | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
    /* eslint-enable no-bitwise, eqeqeq */
  };
  return svc;
}

module.exports = utils;
