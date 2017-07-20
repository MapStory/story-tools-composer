function navigationSvc($location, $rootScope, $log, stateSvc, appConfig) {
  var svc = {};
  var values = {annotations: [], boxes: [], data: []};

  svc.nextChapter = function(){
      var nextChapter = Number(stateSvc.getChapter()) + 1;
      if(nextChapter <= stateSvc.getChapterCount()) {
          $log.info("Going to Chapter ", nextChapter);
          $rootScope.$broadcast('updateTimeValues', values);
          $location.path(appConfig.routes.chapter + nextChapter);
      }else{
          $location.path('');
      }
  };

  svc.previousChapter = function(){
      var previousChapter = Number(stateSvc.getChapter()) - 1;
      if (previousChapter > 0) {
          $log.info("Going to the Chapter ", previousChapter);
          $rootScope.$broadcast('updateTimeValues', values);
          $location.path(appConfig.routes.chapter + previousChapter);
      }else{
          $location.path('');
      }
  };

  return svc;

}

module.exports = navigationSvc;
