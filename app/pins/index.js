'use strict';

var angular = require('angular');
var pinSvc = require('./pinSvc.js');

angular.module('composer').factory('pinSvc', pinSvc);
