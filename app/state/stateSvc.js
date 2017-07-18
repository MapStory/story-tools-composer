function stateSvc($location, $q) {
  var svc = {};
  svc.getConfig = function () {
    var deferred = $q.defer();
    var path = $location.path();
    var mapID = /\/maps\/(\d+)/.exec(path) ? /\/maps\/(\d+)/.exec(path)[1] : null;
    var mapJsonUrl = '/maps/' + mapID + '/data';
    if (mapID) {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl ,
        }).done(function ( data ) {
          deferred.resolve(data);
      });
    } else {
      deferred.resolve(window.config);
    }
    return deferred.promise;
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
    return chapter;
  };
  return svc;
}

module.exports = stateSvc;
