import { module } from "angular";
import addLayers from "./addLayers";
import featureManagerSvc from "./featureManagerSvc";
import layerSvc from "./layerSvc";
import layerOptionsSvc from "./layerOptionsSvc";
import layerList from "./layerList";
import tileProgressController from "./tileProgressController";

angular.module("composer").factory("layerSvc", layerSvc);
angular.module("composer").factory("layerOptionsSvc", layerOptionsSvc);
angular.module("composer").directive("addLayers", addLayers);
angular.module("composer").directive("layerList", layerList);
angular.module("composer").factory("featureManagerSvc", featureManagerSvc);

angular
  .module("composer")
  .controller("tileProgressController", tileProgressController);
