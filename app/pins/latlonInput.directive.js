function latlonInputDirective() {
  return {
    restrict: "E",
    templateUrl: "./app/pins/templates/latlon-input.html",
    controller: "latlonInputController",
    scope: {
      pin: "="
    }
  };
}

module.exports = latlonInputDirective;
