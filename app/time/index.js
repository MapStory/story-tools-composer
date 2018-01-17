'use strict';

const angular = require('angular');
const stateSvc = require('./timeSvc.js');
const datetimepicker = require('./dateTimePickerDirective.js');

angular.module('composer').factory('timeSvc', stateSvc);
angular.module('composer').directive('datetimepicker', datetimepicker);
