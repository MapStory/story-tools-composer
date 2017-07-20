function stateSvc($location, $rootScope, $q) {
  var svc = {};
  svc.config = null;

  svc.initConfig = (function () {
    var path = $location.path();
    var mapID = /\/maps\/(\d+)/.exec(path) ? /\/maps\/(\d+)/.exec(path)[1] : null;
    var mapJsonUrl = '/maps/' + mapID + '/data';
    if (svc.config) {
      return;
    } else if (mapID) {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl ,
        }).done(function ( data ) {
          svc.config = data;
          $rootScope.$broadcast('configInitialized');
      });
    } else {
      svc.config = window.config;
      $rootScope.$broadcast('configInitialized');
    }
  })();

  svc.getConfig = function() {
    return svc.config;
  };

  svc.setConfig = function(config) {
    svc.config = config;
  };

  svc.getChapter = function() {
    var chapter = 1;
    var path = $location.path();
    var matches;
    if (path && path.indexOf('/chapter') === 0){
      if ((matches = /\d+/.exec(path)) !== null) {
        chapter = matches[0];
      }
    }
    return parseInt(chapter);
  };

  svc.getChapterConfig = function() {
    var chapter = svc.getChapter();
    var config = svc.getConfig();
    var i = chapter - 1;

    if (config.chapters[i]) {
      return config.chapters[i];
    } else {
      return config.chapters[0];
    }
  };

  svc.getChapterConfigs = function() {
    var config = svc.getConfig();
    return config.chapters;
  };

  svc.getChapterCount = function() {
    return svc.getChapterConfigs().length;
  };

  return svc;
}

module.exports = stateSvc;
