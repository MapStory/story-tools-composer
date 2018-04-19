function layerOptionsSvc() {
  const svc = {};

  svc.getLayerOptions = (name, settings, server, fitExtent, title) => {
    if (window.storyMap) {
      window.storyMap.setAllowZoom(settings.allowZoom || true);
      window.storyMap.setAllowPan(settings.allowPan || true);
    }
    if (fitExtent === undefined) {
      settings.fitExtent = true;
    }
    let workspace = "geonode";
    const parts = name.split(":");
    if (parts.length > 1) {
      console.log("PARTS LENGTH > 1")
      workspace = parts[0];
      name = parts[1];
    }
    let styleName = window.getStyleName;
    const url = `${server.path + workspace}/${name}/wms`;
    const id = `${workspace}:${name}`;
    const uuid = new Date().getTime();
    const options = {
      id,
      uuid,
      name,
      title: title || name,
      url,
      source: "0",
      path: server.path,
      canStyleWMS: server.canStyleWMS,
      styleName: window.getStyleName(name, uuid),
      timeEndpoint: server.timeEndpoint ? server.timeEndpoint(name) : undefined,
      type: settings.asVector === true ? "VECTOR" : "WMS",
      geomType: "point",
      settings
    };
    return options;
  };

  return svc;
}

export default layerOptionsSvc;
