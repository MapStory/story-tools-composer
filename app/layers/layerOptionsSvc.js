"use strict";

function layerOptionsSvc() {
  const svc = {};

  svc.getLayerOptions = (name, settings, server, fitExtent, styleName, title) => {
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
    let workspace = "geonode";
    const parts = name.split(":");
    if (parts.length > 1) {
      workspace = parts[0];
      name = parts[1];
    }
    const url = `${server.path + workspace}/${name}/wms`;
    const id = `${workspace}:${name}`;
    const options = {
      id: id,
      uuid: new Date().getTime(),
      name: name,
      title: title || name,
      url: url,
      style: styleName,
      geomType: "point", //!DJA
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
