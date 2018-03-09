"use strict";

const angular = require("angular");
const pinSvc = require("./pinSvc.js");
const bulkUploadCtrl = require("./bulkUploadController.js");
const bulkUploadDirective = require("./bulkUpload.directive");
const bulkUploadModalController = require("./bulkUploadModal.controller");
const storypinController = require("./storypin.controller");

angular.module("composer")
  .factory("pinSvc", pinSvc)
  .controller("bulkUploadCtrl", bulkUploadCtrl)
  .controller("bulkUploadModalController", bulkUploadModalController)
  .directive("bulkUploadDirective", bulkUploadDirective)
  .controller("storypinController", storypinController);

