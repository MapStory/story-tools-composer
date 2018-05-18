import legendDirective from "./legend.directive";

const angular = require("angular");
const composerController = require("./composerController.js");
const navigationSvc = require("./navigationSvc.js");


angular.module("composer").controller("composerController", composerController);
angular.module("composer").factory("navigationSvc", navigationSvc);
angular.module("composer").directive("legendDirective", legendDirective);
