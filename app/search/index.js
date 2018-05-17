import { module } from "angular";
import searchConfig from "./searchConfig.js";
import searchSvc from "./searchSvc.js";

module("composer").factory("searchConfig", searchConfig);
module("composer").factory("searchSvc", searchSvc);
