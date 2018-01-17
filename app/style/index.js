'use strict';

const angular = require('angular');
const styleService = require('./styleService.js');

angular.module('composer').service('styleUpdater', styleService);
