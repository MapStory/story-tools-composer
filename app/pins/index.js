import {configuration,
  mediaService,
  StoryPinLayerManager,
  StoryPin,
  stAnnotationsStore} from "./module";

const angular = require("angular");
const pinSvc = require("./pinSvc.js");
const bulkUploadCtrl = require("./bulkUploadController.js");
const bulkUploadDirective = require("./bulkUpload.directive");
const bulkUploadModalController = require("./bulkUploadModal.controller");
const storypinController = require("./storypin.controller");
const latlonInputCtrl = require("./latlonInputController");
const latlonInputDirective = require("./latlonInput.directive");


angular.module("composer")
  .config(configuration)
  .provider("mediaService", mediaService)
  .service("StoryPinLayerManager", StoryPinLayerManager)
  .constant("StoryPin", StoryPin)
  .service("stAnnotationsStore", stAnnotationsStore)
  .factory("pinSvc", pinSvc)
  .controller("bulkUploadCtrl", bulkUploadCtrl)
  .controller("bulkUploadModalController", bulkUploadModalController)
  .directive("bulkUploadDirective", bulkUploadDirective)
  .controller("storypinController", storypinController)
  .controller("latlonInputController", latlonInputCtrl)
  .directive("latlonInput", latlonInputDirective);

