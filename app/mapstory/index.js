import { module } from "angular";
import stLocalStorageSvc from "./stLocalStorageSvc";
import stRemoteStorageSvc from "./stRemoteStorageSvc";

module("composer")
  .service("stLocalStorageSvc", stLocalStorageSvc)
  .factory("stRemoteStorageSvc", stRemoteStorageSvc);

