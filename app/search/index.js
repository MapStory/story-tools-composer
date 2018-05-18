import { module } from "angular";
import searchConfig from "./searchConfig";
import searchSvc from "./searchSvc";

module("composer").factory("searchConfig", searchConfig);
module("composer").factory("searchSvc", searchSvc);
