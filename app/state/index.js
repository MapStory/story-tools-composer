'use strict';

var angular = require('angular');
var stateSvc = require('./stateSvc.js');
var newConfigSvc = require('./newConfigSvc.js');

angular.module('composer').factory('stateSvc', stateSvc);
angular.module('composer').factory('newConfigSvc', newConfigSvc);
