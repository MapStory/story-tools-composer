'use strict';

var angular = require('angular');
var composerController = require('./composerController.js');
var sidebar = require('./sidebar.js');
var header = require('./header.js');

angular.module('composer').controller('composerController', composerController);
angular.module('composer').directive('sidebar', sidebar);
angular.module('composer').directive('composerHeader', header);
