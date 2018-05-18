import { module } from "angular";
import stateSvc from "./timeSvc.js";

module("composer").factory("timeSvc", stateSvc);
