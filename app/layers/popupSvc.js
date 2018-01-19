"use strict";

function popupSvc(olpopup) {
  const svc = {};
  olpopup.init();
  svc.displayInfo = (pixel, pin) => {
    let feature = null;
    const embed_params = {
      nowrap: "on",
      maxwidth: 250,
      maxheight: 250
    };
    if (typeof pin == "undefined" || pin == null) {
      feature = window.storyMap
        .getMap()
        .forEachFeatureAtPixel(pixel, (feature, layer) => feature);
    } else {
      feature = pin;
    }
    if (feature) {
      const overlays = window.storyMap
        .getMap()
        .getOverlays()
        .getArray();
      let popup = null;
      const titleDescrip =
        `<div style="text-align:center;"><h4>${feature.get("title")}</h4></div><hr>${feature.get("content")}`;
      const geometry = feature.getGeometry();
      const coord = geometry.getCoordinates();
      for (let iOverlay = 0; iOverlay < overlays.length; iOverlay += 1) {
        const overlay = overlays[iOverlay];
        if (overlay.getId && overlay.getId() == `popup-${feature.id}`) {
          popup = overlay;
          break;
        }
      }

      if (popup === null) {
        const popupOptions = {
          insertFirst: false,
          id: `popup-${feature.id}`,
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
          .then(result => {
            const cont = result ? titleDescrip + result : titleDescrip;
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
