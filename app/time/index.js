'use strict';

var angular = require('angular');
var stateSvc = require('./timeSvc.js');
var datetimepicker = require('./dateTimePickerDirective.js');

angular.module('composer').factory('timeSvc', stateSvc);
angular.module('composer').directive('datetimepicker', datetimepicker);
