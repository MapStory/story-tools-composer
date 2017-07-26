'use strict';

var angular = require('angular');
var composerController = require('./composerController.js');
var navigationSvc = require('./navigationSvc.js');
var uiHelperSvc = require('./uiHelperSvc.js');

angular.module('composer').controller('composerController', composerController);
angular.module('composer').factory('navigationSvc', navigationSvc);
angular.module('composer').factory('uiHelperSvc', uiHelperSvc);
