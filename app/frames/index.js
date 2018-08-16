import frameController from "./frameController.js";
import frameSvc from "./frameSvc.js";

angular
  .module("composer")
  .factory("frameSvc", frameSvc)
  .controller("frameController", frameController);
