function navigationSvc($location, $rootScope, $log, stateSvc, appConfig) {
  const svc = {};
  const values = { annotations: [], boxes: [], data: [] };

  svc.nextChapter = () => {
    const nextChapter = Number(stateSvc.getChapter()) + 1;
    if (nextChapter <= stateSvc.getChapterCount()) {
      $log.info("Going to Chapter ", nextChapter);
      $rootScope.$broadcast("updateTimeValues", values);
      $location.path(appConfig.routes.chapter + nextChapter);
    } else {
      $location.path("");
    }
  };

  svc.previousChapter = () => {
    const previousChapter = Number(stateSvc.getChapter()) - 1;
    if (previousChapter > 0) {
      $log.info("Going to the Chapter ", previousChapter);
      $rootScope.$broadcast("updateTimeValues", values);
      $location.path(appConfig.routes.chapter + previousChapter);
    } else {
      $location.path("");
    }
  };

  svc.goToChapter = number => {
    if (number > 0) {
      $log.info("Going to the Chapter ", number);
      $rootScope.$broadcast("updateTimeValues", values);
      $location.path(appConfig.routes.chapter + number);
    } else {
      $location.path("");
    }
  };

  return svc;
}

module.exports = navigationSvc;
