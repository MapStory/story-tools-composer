"use strict";

function popupSvc(olpopup) {
  var svc = {};
  olpopup.init();
  svc.displayInfo = function(pixel, pin) {
    var feature = null;
    var embed_params = {
      nowrap: "on",
      maxwidth: 250,
      maxheight: 250
    };
    console.log("STORY MAP: ", self.storyMap);
    if (typeof pin == "undefined" || pin == null) {
      feature = window.storyMap
        .getMap()
        .forEachFeatureAtPixel(pixel, function(feature, layer) {
          console.log("FEATURE CLICKED");
          return feature;
        });
    } else {
      feature = pin;
    }
    if (feature) {
      var overlays = window.storyMap
        .getMap()
        .getOverlays()
        .getArray();
      var popup = null;
      var titleDescrip =
        '<div style="text-align:center;"><h4>' +
        feature.get("title") +
        "</h4></div><hr>" +
        feature.get("content");
      var geometry = feature.getGeometry();
      var coord = geometry.getCoordinates();
      for (var iOverlay = 0; iOverlay < overlays.length; iOverlay += 1) {
        var overlay = overlays[iOverlay];
        if (overlay.getId && overlay.getId() == "popup-" + feature.id) {
          popup = overlay;
          break;
        }
      }

      if (popup === null) {
        var popupOptions = {
          insertFirst: false,
          id: "popup-" + feature.id,
          positioning: "bottom-center",
          stopEvent: false
        };
        popup = new ol.Overlay.Popup(popupOptions);
        self.storyMap.getMap().addOverlay(popup);
        $rootScope.$broadcast("pausePlayback");
      }
      popup.setPosition(coord);
      if (feature.get("media")) {
        mediaService
          .getEmbedContent(feature.get("media"), embed_params)
          .then(function(result) {
            var cont = result ? titleDescrip + result : titleDescrip;
            popup.show(coord, cont);
          });
      } else {
        popup.show(coord, titleDescrip);
      }
    }
  };
  return svc;
}

module.exports = popupSvc;
