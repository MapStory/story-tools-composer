"use strict";

var angular = require("angular");
var searchConfig = require("./searchConfig.js");
var searchSvc = require("./searchSvc.js");
var paginationSvc = require("./paginationSvc.js");

angular.module("composer").factory("searchConfig", searchConfig);
angular.module("composer").factory("searchSvc", searchSvc);
angular.module("composer").factory("paginationSvc", paginationSvc);
