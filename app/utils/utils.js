function utils() {
  const svc = {};
  Array.prototype.move = function(old_index, new_index) {
    if (new_index >= this.length) {
      let k = new_index - this.length;
      while (k-- + 1) {
        this.push(undefined);
      }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
  };
  return svc;
}

module.exports = utils;
