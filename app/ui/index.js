import legendDirective from "./legend.directive";

const angular = require("angular");
const composerController = require("./composerController.js");
const navigationSvc = require("./navigationSvc.js");
const uiHelperSvc = require("./uiHelperSvc.js");


angular.module("composer").controller("composerController", composerController);
angular.module("composer").factory("navigationSvc", navigationSvc);
angular.module("composer").factory("uiHelperSvc", uiHelperSvc);
angular.module("composer").directive("legendDirective", legendDirective);
