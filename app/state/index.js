'use strict';

var angular = require('angular');
var stateSvc = require('./stateSvc.js');

angular.module('composer').factory('stateSvc', stateSvc);
