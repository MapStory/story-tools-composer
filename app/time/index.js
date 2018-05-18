import { module } from "angular";
import stateSvc from "./timeSvc";

module("composer").factory("timeSvc", stateSvc);
