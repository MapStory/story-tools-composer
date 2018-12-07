export default {
  /*
   * `location.path` replaces the app's hashbang value if an arg is provided;
   *  otherwise it returns the current value
   */

  path: arg => {
    if (arg !== undefined && arg !== null) {
      window.location.hash = `#!${arg}`;
      return window.location.hash;
    }
    return window.location.hash.replace("#!", "");
  }
};
