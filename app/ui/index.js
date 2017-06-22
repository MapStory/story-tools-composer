'use strict';

var angular = require('angular');
var composerController = require('./composerController.js');

angular.module('composer').controller('composerController', composerController);
angular.module('composer').directive('sidebar', function() {
  return {
    restrict: 'E',
    scope: {
    },
    link: function(scope) {
    },
    templateUrl: "app/ui/templates/sidebar.html"
  };
});
