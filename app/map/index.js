'use strict';

const angular = require('angular');
const MapManager = require('./mapManager.js');

angular.module('composer').service('MapManager', $injector => $injector.instantiate(MapManager));
