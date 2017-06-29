function timeControls() {
  return {
    restrict: 'E',
    scope: {},
    link: function(scope) {
    },
    templateUrl: "app/time/templates/time-controls.html",
    controller: "timeController"
  };
}

module.exports = timeControls;
