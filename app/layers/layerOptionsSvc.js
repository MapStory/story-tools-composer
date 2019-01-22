const layerOptionsSvc = {
  getLayerOptions: args => {
    let name = args.name;
    const settings = { ...args.settings };
    settings.fitExtent = true;
    const server = args.server;
    const title = args.title;
    const params = settings ? settings.params : {};

    if (window.storyMap && settings) {
      window.storyMap.setAllowZoom(settings.allowZoom || true);
      window.storyMap.setAllowPan(settings.allowPan || true);
    }
    let workspace = "geonode";
    const parts = name ? name.split(":") : [];
    if (parts.length > 1) {
      workspace = parts[0];
      name = parts[1];
    }

    const url =
      server && server.type === "remote"
        ? server.absolutePath
        : `${server.path + workspace}/${name}/wms`;
    const id = `${workspace}:${name}`;
    const options = {
      id,
      name,
      title: title || name,
      url,
      source: "0",
      path: server.path,
      canStyleWMS: server.canStyleWMS,
      styleName: null,
      timeEndpoint: server.timeEndpoint ? server.timeEndpoint(name) : undefined,
      type: settings.asVector === true ? "VECTOR" : "WMS",
      geomType: "point",
      params,
      settings
    };
    return options;
  }
};

export default layerOptionsSvc;
