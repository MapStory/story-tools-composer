"use strict";

const angular = require("angular");
const searchConfig = require("./searchConfig.js");
const searchSvc = require("./searchSvc.js");
const paginationSvc = require("./paginationSvc.js");

angular.module("composer").factory("searchConfig", searchConfig);
angular.module("composer").factory("searchSvc", searchSvc);
angular.module("composer").factory("paginationSvc", paginationSvc);
