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
      PubSub.publish("changingChapter", thisChapter - 1, nextChapter - 1); // (-1 because indeces start at 1)
      $location.path(appConfig.routes.chapter + nextChapter);
    } else {
      // Go from last to first.
      $log.info("Going to Chapter ", 1);
      $location.path("");
      PubSub.publish("changingChapter", thisChapter - 1, 0);
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
      PubSub.publish("changingChapter", thisChapter - 1, previousChapter - 1); // (-1 because indeces start at 1)
      $location.path(appConfig.routes.chapter + previousChapter);
    } else {
      // Go from first to last.
      $log.info("Going to Chapter ", stateSvc.getChapterCount());
      svc.goToChapter(stateSvc.getChapterCount());
      PubSub.publish(
        "changingChapter",
        thisChapter - 1,
        stateSvc.getChapterCount() - 1
      );
    }
  };

  /**
   * Goes to given chapter (from 1 to N chapters)
   * @param number
   */
  svc.goToChapter = number => {
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
