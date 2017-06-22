'use strict';

var angular = require('angular');
var MapManager = require('./mapManager.js');
var mapcanvas = require('./mapDirective.js');

angular.module('composer').service('MapManager', function($injector) {
    return $injector.instantiate(MapManager);
});
angular.module('composer').directive('mapcanvas', mapcanvas);
