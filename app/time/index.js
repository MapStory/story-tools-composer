'use strict';

var angular = require('angular');
var stateSvc = require('./timeSvc.js');

angular.module('composer').factory('timeSvc', stateSvc);
