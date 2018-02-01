"use strict";

const angular = require("angular");
const pinSvc = require("./pinSvc.js");

angular.module("composer").factory("pinSvc", pinSvc);
