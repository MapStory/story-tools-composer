import PubSub from "pubsub-js";
import appConfig from "app/appConfig";
import stateSvc from "app/state/stateSvc";
import locationSvc from "app/ui/locationSvc";

function navigationSvc($location, $log) {
  // locationSvc is being hitched to navigationSvc temporarily in order
  // for Karma tests to have acces.
  // @TODO: remove locationSvc after karma tests have been configured to
  // import ES6 modules.

  const svc = {
    locationSvc
  };

  /**
   * Navigates to next chapter or loops around.
   * NOTE: Chapter number starts at 1.
   */

  svc.nextChapter = () => {
    const thisChapter = Number(stateSvc.getChapter());
    const nextChapter = thisChapter + 1;
    if (nextChapter <= stateSvc.getChapterCount()) {
      // Go to next
      $log.info("Going to Chapter ", nextChapter);
      // These are array indexes, so subtract 1 from the 1 based chapter number
      const data = {
        currentChapterIndex: thisChapter - 1,
        nextChapterIndex: nextChapter - 1
      };
      // $location.path(appConfig.routes.chapter + nextChapter);
      locationSvc.path(appConfig.routes.chapter + nextChapter);
      PubSub.publish("changingChapter", data);
    } else {
      // Go from last to first.
      $log.info("Going to Chapter ", 1);
      const data = {
        currentChapterIndex: thisChapter - 1,
        nextChapterIndex: 0
      };
      locationSvc.path("");
      PubSub.publish("changingChapter", data);
    }
  };

  /**
   * Navigates to previous chapter or loops around.
   * NOTE: Chapter number starts at 1.
   */
  svc.previousChapter = () => {
    const thisChapter = Number(stateSvc.getChapter());
    const previousChapter = thisChapter - 1;
    if (previousChapter > 0) {
      // Go to previous
      $log.info("Going to the Chapter ", previousChapter);
      // (-1 because the getChapter and thisChapter start at 1, rather than 0)
      const data = {
        currentChapterIndex: thisChapter - 1,
        nextChapterIndex: previousChapter - 1
      };

      PubSub.publish("changingChapter", data);
      locationSvc.path(appConfig.routes.chapter + previousChapter);
    } else {
      // Go from first to last.
      $log.info("Going to Chapter ", stateSvc.getChapterCount());
      const data = {
        currentChapterIndex: thisChapter - 1,
        nextChapterIndex: stateSvc.getChapterCount() - 1
      };
      PubSub.publish("changingChapter", data);
      setTimeout(() => {
        svc.goToChapter(stateSvc.getChapterCount());
      });
    }
  };

  /**
   * Goes to given chapter (from 1 to N chapters)
   * @param number
   */
  svc.goToChapter = number => {
    const thisChapter = Number(stateSvc.getChapter());
    const data = {
      currentChapterIndex: thisChapter - 1,
      nextChapterIndex: number - 1
    };
    PubSub.publish("changingChapter", data);
    if (number > 0) {
      $log.info("Going to the Chapter ", number);
      locationSvc.path(appConfig.routes.chapter + number);
    } else {
      locationSvc.path("");
    }
  };

  return svc;
}

module.exports = navigationSvc;
