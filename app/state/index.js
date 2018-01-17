'use strict';

const angular = require('angular');
const stateSvc = require('./stateSvc.js');
const newConfigSvc = require('./newConfigSvc.js');

angular.module('composer').factory('stateSvc', stateSvc);
angular.module('composer').factory('newConfigSvc', newConfigSvc);
