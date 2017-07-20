function stateSvc($location, $rootScope, $q, stAnnotationsStore, stLocalStorageSvc) {
  var svc = {};
  svc.config = null;
  svc.originalConfig = null;

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
          svc.originalConfig = data;
          $rootScope.$broadcast('configInitialized');
      });
    } else {
      svc.config = window.config;
      svc.originalConfig = window.config;
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
    if (config.chapters && chapter > 0 && chapter <= config.chapters.length) {
      if (config.chapters[i]) {
        return config.chapters[i];
      } else {
        return config.chapters[0];
      }
    } else {
      return config;
    }
  };

  svc.getChapterAbout = function() {
    return svc.getChapterConfig().about;
  };

  svc.getChapterConfigs = function() {
    var config = svc.getConfig();
    return config.chapters;
  };

  svc.getChapterCount = function() {
    return svc.getChapterConfigs().length;
  };

  this.saveMap = function() {
      var config = this.storyMap.getState();
      stLocalStorageSvc.saveConfig(config);
      if (this.storyMap.get('id') === undefined) {
          this.storyMap.set('id', config.id);
      }
      stAnnotationsStore.saveAnnotations(this.storyMap.get('id'), StoryPinLayerManager.storyPins);
  };

  return svc;
}

module.exports = stateSvc;
