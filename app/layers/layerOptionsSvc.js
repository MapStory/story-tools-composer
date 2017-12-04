"use strict";

function layerOptionsSvc() {
  var svc = {};

  svc.getLayerOptions = function(
    name,
    settings,
    server,
    fitExtent,
    styleName,
    title
  ) {
    if (window.storyMap) {
      window.storyMap.setAllowZoom(settings.allowZoom || true);
      window.storyMap.setAllowPan(settings.allowPan || true);
    }
    if (fitExtent === undefined) {
      settings.fitExtent = true;
    }
    if (angular.isString(server)) {
      server = getServer(server);
    }
    var workspace = "geonode";
    var parts = name.split(":");
    if (parts.length > 1) {
      workspace = parts[0];
      name = parts[1];
    }
    var url = server.path + workspace + "/" + name + "/wms";
    var id = workspace + ":" + name;
    var options = {
      id: id,
      uuid: new Date().getTime(),
      name: name,
      title: title || name,
      url: url,
      path: server.path,
      canStyleWMS: server.canStyleWMS,
      timeEndpoint: server.timeEndpoint ? server.timeEndpoint(name) : undefined,
      type: settings.asVector === true ? "VECTOR" : "WMS",
      settings: settings
    };
    return options;
  };

  return svc;
}

module.exports = layerOptionsSvc;
