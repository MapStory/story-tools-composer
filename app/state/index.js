import { module } from "angular";
import stateSvc from "./stateSvc";
import configSvc from "./configSvc";

module("composer").factory("stateSvc", stateSvc);
module("composer").factory("configSvc", configSvc);
