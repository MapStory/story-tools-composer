'use strict';

const angular = require('angular');
const stateSvc = require('./stateSvc.js');
const configSvc = require('./configSvc.js');

angular.module('composer').factory('stateSvc', stateSvc);
angular.module('composer').factory('configSvc', configSvc);
