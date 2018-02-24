"use strict";

const angular = require("angular");
const pinSvc = require("./pinSvc.js");
const bulkUploadCtrl = require("./bulkUploadController.js");
const bulkUploadDirective = require("./bulkUpload.directive");
const bulkUploadModalController = require("./bulkUploadModal.controller");


angular.module("composer").factory("pinSvc", pinSvc);
angular.module("composer").controller("bulkUploadCtrl", bulkUploadCtrl);
angular.module("composer").controller("bulkUploadModalController", bulkUploadModalController);
angular.module("composer").directive("bulkUploadDirective", bulkUploadDirective);
