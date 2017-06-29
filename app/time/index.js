'use strict';

var angular = require('angular');
var timeDirective = require('./timeDirective.js');
var timeController = require('./timeController.js');

angular.module('composer').controller('timeController', timeController);
angular.module('composer').directive('timeControls', timeDirective);
