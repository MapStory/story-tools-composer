import { module } from "angular";
import addLayers from "./addLayers.js";
import featureManagerSvc from "./featureManagerSvc.js";
import layerSvc from "./layerSvc.js";
import layerOptionsSvc from "./layerOptionsSvc.js";
import layerList from "./layerList.js";
import tileProgressController from "./tileProgressController.js";

angular.module("composer").factory("layerSvc", layerSvc);
angular.module("composer").factory("layerOptionsSvc", layerOptionsSvc);
angular.module("composer").directive("addLayers", addLayers);
angular.module("composer").directive("layerList", layerList);
angular.module("composer").factory("featureManagerSvc", featureManagerSvc);

angular
  .module("composer")
  .controller("tileProgressController", tileProgressController);
