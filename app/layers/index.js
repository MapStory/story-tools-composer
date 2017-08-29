"use strict";

var angular = require("angular");
var addLayers = require("./addLayers.js");
var addLayerSvc = require("./addLayerSvc.js");
var layerList = require("./layerList.js");
var featureManagerSvc = require("./featureManagerSvc.js");
var tileProgressController = require("./tileProgressController.js");

angular.module("composer").factory("addLayerSvc", addLayerSvc);
angular.module("composer").directive("addLayers", addLayers);
angular.module("composer").directive("layerList", layerList);
angular.module("composer").factory("featureManagerSvc", featureManagerSvc);

angular
  .module("composer")
  .controller("tileProgressController", tileProgressController);
