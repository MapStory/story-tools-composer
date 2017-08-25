"use strict";

function addLayers($log, $http, $sce, limitToFilter, MapManager, appConfig) {
  return {
    restrict: "E",
    scope: {
      map: "="
    },
    templateUrl: "./app/layers/templates/add-layers.html",
    link: function(scope, el, atts) {
      scope.server = {
        active: appConfig.servers[0]
      };
      scope.servers = appConfig.servers;
      scope.results = function(layer_name) {
        var url =
          scope.server.active.host +
          "/api/base/search/?type__in=layer&q=" +
          layer_name;
        return $http.get(url).then(function(response) {
          var names = [];
          for (var i = 0; i < response.data.objects.length; i++) {
            if (response.data.objects[i].title) {
              names.push(response.data.objects[i].typename);
            }
          }
          console.log("NAMES --- >", names);
          return limitToFilter(names, 15);
        });
      };
      scope.addLayer = function() {
        scope.loading = true;
        var settings = {
          asVector: this.asVector,
          allowZoom: this.allowZoom,
          allowPan: this.allowPan
        };
        MapManager.addLayer(this.layerName, settings, scope.server.active)
          .then(
            function() {
              // pass
              scope.$parent.status.open = false;
            },
            function(problems) {
              var msg = "Something went wrong:";
              if (problems[0].status == 404) {
                msg = "Cannot find the specified layer: ";
              } else {
                msg += problems[0].data;
              }
              $log.warn(
                "Failed to load %s because of %s",
                scope.layerName,
                problems
              );
            }
          )
          .finally(function() {
            scope.loading = false;
          });
        scope.layerName = null;
      };
    }
  };
}

module.exports = addLayers;
