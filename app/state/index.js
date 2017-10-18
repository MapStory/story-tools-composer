'use strict';

var angular = require('angular');
var stateSvc = require('./stateSvc.js');
var newChapterConfigSvc = require('./newChapterConfigSvc.js');

angular.module('composer').factory('stateSvc', stateSvc);
angular.module('composer').factory('newChapterConfigSvc', newChapterConfigSvc);
