import { module } from "angular";
import stateSvc from "./timeSvc";
import {TimeControlsManager, TimeMachine} from "./services";
import {stPlaybackControls, stPlaybackSettings} from "./directives";

module("composer")
  .factory("timeSvc", stateSvc)
  .constant("TimeControlsManager", TimeControlsManager)
  .directive("stPlaybackControls", stPlaybackControls)
  .directive("stPlaybackSettings", stPlaybackSettings)
  .service("TimeMachine", TimeMachine);
