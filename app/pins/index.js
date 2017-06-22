'use strict';

var angular = require('angular');
var storyPins = require('./storyPins.js');

angular.module('composer').directive('storypin-sidebar', storyPins);
