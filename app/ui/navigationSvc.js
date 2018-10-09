import PubSub from "pubsub-js";

function navigationSvc($location, $log, stateSvc, appConfig) {
  const svc = {};

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
      PubSub.publish("changingChapter", data);
      $location.path(appConfig.routes.chapter + nextChapter);
    } else {
      // Go from last to first.
      $log.info("Going to Chapter ", 1);
      $location.path("");
      const data = {
        currentChapterIndex: thisChapter - 1,
        nextChapterIndex: 0
      };
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
      $location.path(appConfig.routes.chapter + previousChapter);
    } else {
      // Go from first to last.
      $log.info("Going to Chapter ", stateSvc.getChapterCount());
      svc.goToChapter(stateSvc.getChapterCount());
      const data = {
        currentChapterIndex: thisChapter - 1,
        nextChapterIndex: stateSvc.getChapterCount() - 1
      };
      PubSub.publish(
        "changingChapter", data
      );
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
    PubSub.publish(
      "changingChapter", data
    );
    if (number > 0) {
      $log.info("Going to the Chapter ", number);
      $location.path(appConfig.routes.chapter + number);
    } else {
      $location.path("");
    }
  };

  return svc;
}

module.exports = navigationSvc;
