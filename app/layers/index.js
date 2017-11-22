"use strict";

var angular = require("angular");
var addLayers = require("./addLayers.js");
var layerSvc = require("./layerSvc.js");
var layerOptionsSvc = require("./layerOptionsSvc.js");
var layerList = require("./layerList.js");
var tileProgressController = require("./tileProgressController.js");
var popupSvc = require("./popupSvc.js");
var olpopup = require("./ol3-popup.js");
var featureManagerSvc = require("./featureManagerSvc.js");

angular.module("composer").factory("olpopup", olpopup);
angular.module("composer").factory("popupSvc", popupSvc);
angular.module("composer").factory("layerSvc", layerSvc);
angular.module("composer").factory("layerOptionsSvc", layerOptionsSvc);
angular.module("composer").directive("addLayers", addLayers);
angular.module("composer").directive("layerList", layerList);
angular.module("composer").factory("featureManagerSvc", featureManagerSvc);

angular
  .module("composer")
  .controller("tileProgressController", tileProgressController);
