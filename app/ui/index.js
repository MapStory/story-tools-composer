'use strict';

var angular = require('angular');
var composerController = require('./composerController.js');
var navigationSvc = require('./navigationSvc.js');

angular.module('composer').controller('composerController', composerController);
angular.module('composer').factory('navigationSvc', navigationSvc);
