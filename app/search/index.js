"use strict";

var angular = require("angular");
var searchConfig = require("./searchConfig.js");
var searchSvc = require("./searchSvc.js");

angular.module("composer").factory("searchConfig", searchConfig);
angular.module("composer").factory("searchSvc", searchSvc);
