import { module } from "angular";
import stateSvc from "./stateSvc.js";
import configSvc from "./configSvc.js";

module("composer").factory("stateSvc", stateSvc);
module("composer").factory("configSvc", configSvc);
