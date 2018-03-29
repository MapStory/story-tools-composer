"use strict";

const angular = require("angular");
const composerController = require("./composerController.js");
const navigationSvc = require("./navigationSvc.js");
const uiHelperSvc = require("./uiHelperSvc.js");
const legendDirective = require("./legend.directive");

angular.module("composer").controller("composerController", composerController);
angular.module("composer").factory("navigationSvc", navigationSvc);
angular.module("composer").factory("uiHelperSvc", uiHelperSvc);
angular.module("composer").directive("legendDirective", legendDirective);