'use strict';

var angular = require('angular');
var timeControls = require('./timeControls.js');

angular.module('composer').directive('timeControls', timeControls);
