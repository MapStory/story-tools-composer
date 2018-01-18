const angular = require("angular");
const addLayers = require("./addLayers.js");
const layerSvc = require("./layerSvc.js");
const layerOptionsSvc = require("./layerOptionsSvc.js");
const layerList = require("./layerList.js");
const styleSvc = require("./styleSvc.js");
const tileProgressController = require("./tileProgressController.js");
const popupSvc = require("./popupSvc.js");
const olpopup = require("./ol3-popup.js");
const featureManagerSvc = require("./featureManagerSvc.js");

angular.module("composer").factory("olpopup", olpopup);
angular.module("composer").factory("popupSvc", popupSvc);
angular.module("composer").factory("layerSvc", layerSvc);
angular.module("composer").factory("layerOptionsSvc", layerOptionsSvc);
angular.module("composer").directive("addLayers", addLayers);
angular.module("composer").directive("layerList", layerList);
angular.module("composer").factory("featureManagerSvc", featureManagerSvc);
angular.module("composer").service("styleSvc", styleSvc);

angular
  .module("composer")
  .controller("tileProgressController", tileProgressController);
