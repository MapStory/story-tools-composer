import { module } from "angular";
import MapManager from "./mapManager";

module("composer").service("MapManager", $injector =>
  $injector.instantiate(MapManager)
);
