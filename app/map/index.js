import { module } from "angular";
import MapManager from "./mapManager.js";

module("composer").service("MapManager", $injector =>
  $injector.instantiate(MapManager)
);
