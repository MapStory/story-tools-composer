import {formatTimelineDate} from "./core/utils";

/**
 * @ngdoc directive
 * @name stPlaybackControls
 * @memberOf storytools.core.time.directives
 * @description
 * Directive that presents playback controls to manipulate the provided
 * TimeController instance.
 *
 * @param {TimeController} time-controls attribute
 */
export function stPlaybackControls() {
  return {
    restrict: "E",
    templateUrl: "./app/time/templates/playback-controls.html",
    scope: {
      timeControls: "=",
      playbackOptions: "="
    },
    link (scope, elem) {
      scope.formatTime = formatTimelineDate;
      scope.playbackState = "Play";
      scope.loopText = "Loop Chapter";
      scope.loopStoryEnabled = false;
      scope.loopChapterEnabled = false;
      scope.showPlaybackCtrls = false;
      scope.next = function () {
        scope.timeControls.next();
      };
      scope.prev = function () {
        scope.timeControls.prev();
      };
      scope.$watch("timeControls", (neu, old) => {
        if (neu !== old) {
          neu.on("stateChange", () => {
            const started = scope.timeControls.isStarted();
            scope.started = started;
            scope.playbackState = started ? "Pause" : "Play";
            scope.$apply();
          });
          neu.on("rangeChange", (range) => {
            scope.currentRange = range;
            scope.$apply();
          });
        }
      });
      scope.$on("pausePlayback", () => {
        const tc = scope.timeControls;
        const started = tc.isStarted();
        if (started) {
          tc.stop();
        }
      });
      scope.play = function () {
        const tc = scope.timeControls;
        const started = tc.isStarted();
        if (started) {
          tc.stop();
        } else {
          tc.start();
        }
      };

      if (window.mapstory.composerMode === "False") {
        scope.composerMode = false;
      } else {
        scope.composerMode = true;
      }

      /**
         * Check if window is in full screen mode.
         * @return {Boolean} full screen mode
         */
      scope.isInFullScreen = function (doc) {


        if (doc.fullScreenElement !== undefined) {
          return !!doc.fullScreenElement;
        }


        if (doc.mozFullScreen !== undefined) {
          return !!doc.mozFullScreen;
        }


        if (doc.webkitIsFullScreen !== undefined) {
          return !!doc.webkitIsFullScreen;
        }


        if (window.fullScreen !== undefined) {
          return !!window.fullScreen;
        }


        if (window.navigator.standalone !== undefined) {
          return !!window.navigator.standalone;
        }
      };

      scope.toggleFullScreen = function () {
        const elem = window.parent.document.getElementById("embedded_map");

        if (!this.isInFullScreen(document) && !this.isInFullScreen(parent.document)) {
          if (!document.webkitFullScreen || !document.mozFullScreen || !document.msFullscreenElement || !document.fullscreenElement) {
            if (elem.requestFullscreen) {
              elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
              elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
              elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullScreen) {
              elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          }
        } else if (document.mozCancelFullScreen) {
          parent.document.mozCancelFullScreen();
          document.mozCancelFullScreen();
        } else {
          parent.document.webkitCancelFullScreen();
          document.webkitCancelFullScreen();
        }
      };

      scope.toggleLoop = function () {
        const tc = scope.timeControls;
        if (tc.loop === "none") {
          scope.loop = tc.loop = "chapter";
          scope.loopText = "Loop Story";
          scope.loopChapterEnabled = true;
        } else if (tc.loop === "chapter") {
          scope.loop = tc.loop = "story";
          scope.loopText = "Disable Loop";
          scope.loopStoryEnabled = true;
          scope.loopChapterEnabled = false;
        } else {
          scope.loopText = "Loop Chapter";
          scope.loop = tc.loop = "none";
          scope.loopStoryEnabled = false;
          scope.loopChapterEnabled = false;          }
      };

      scope.getLoopButtonGlyph = function(){
        if (scope.loop === "story") {
          return "glyphicon glyphicon-refresh";
        } 
        return "glyphicon glyphicon-repeat";
          
      };

      $("#timeline").hide();
      $("#playback-settings").hide();

      scope.toggleTimeLine = function () {
        $("#timeline").slideToggle("fast");
      };

      scope.togglePlaybackControls = function () {
        $("#playback-settings").slideToggle("fast");
      };
    }
  };
}


/**
 * @ngdoc directive
 * @name stPlaybackSettings
 * @memberOf storytools.core.time.directives
 * @description
 * Directive that presents playback settings that manipulate the provided
 * TimeController instance.
 *
 * @param {TimeController} time-controls attribute
 * @param {object} playbackOptions (will go away)
 */
export function stPlaybackSettings() {
  return {
    restrict: "E",
    templateUrl: "./app/time/templates/playback-settings.html",
    scope: {
      timeControls: "=",
      // @todo remove once timeControls properly exposes access to this
      playbackOptions: "="
    },
    link (scope, elem) {
      scope.optionsChanged = function () {
        if (scope.timeControls) {
          scope.timeControls.update(scope.playbackOptions);
        }
      };
    }
  };
}