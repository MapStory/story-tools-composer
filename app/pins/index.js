"use strict";

const angular = require("angular");
const pinSvc = require("./pinSvc.js");
const bulkUploadController = require("./bulkUploadController.js");

angular.module("composer").factory("pinSvc", pinSvc);
angular.module("composer").controller("bulkUploadCtrl", bulkUploadController);
