import { module } from "angular";
import addLayers from "./addLayers";
import featureManagerSvc from "./featureManagerSvc";
import layerSvc from "./layerSvc";
import layerOptionsSvc from "./layerOptionsSvc";
import layerList from "./layerList";
import tileProgressController from "./tileProgressController";

module("composer").factory("layerSvc", layerSvc);
module("composer").factory("layerOptionsSvc", layerOptionsSvc);
module("composer").directive("addLayers", addLayers);
module("composer").directive("layerList", layerList);
module("composer").factory("featureManagerSvc", featureManagerSvc);

module("composer").controller("tileProgressController", tileProgressController);
