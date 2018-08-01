import { module } from "angular";
import addLayers from "./addLayerDirective";
import featureManagerSvc from "./featureManagerSvc";
import layerSvc from "./layerSvc";
import layerOptionsSvc from "./layerOptionsSvc";
import layerList from "./layerList";

module("composer").factory("layerSvc", layerSvc);
module("composer").factory("layerOptionsSvc", layerOptionsSvc);
module("composer").directive("addLayers", addLayers);
module("composer").directive("layerList", layerList);
module("composer").factory("featureManagerSvc", featureManagerSvc);
