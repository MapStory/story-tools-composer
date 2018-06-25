const angular = require("angular");
const frameController = require("./frameController.js");
const frameSvc = require("./frameSvc.js");

angular.module("composer")
  .factory("frameSvc", frameSvc)
  .controller("frameController", frameController);
