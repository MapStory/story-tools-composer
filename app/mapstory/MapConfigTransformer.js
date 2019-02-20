const getLayerType = (source, layer) => (source.ptype === "gx_olsource") ? layer.type.replace("OpenLayers.Layer.", "") : "WMS";

const checkIfHumanitarian = (layerConfig) => {
  if (layerConfig.args && layerConfig.args[0] === "Humanitarian OpenStreetMap") {
    layerConfig.type = "HOT";
  }
};

function handleBasicSourceTypes(source, layerConfig, layer){
  switch (source.ptype){
  case "gxp_mapquestsource":
    layerConfig.type = "MapQuest";
    layerConfig.layer = layer.name === "naip" ? "sat" : "osm";
    layerConfig.title = layer.title;
    break;
  case "gxp_mapboxsource":
    layerConfig.type = "MapBox";
    layerConfig.name = layer.name;
    layerConfig.title = layer.title;
    break;
  case "gxp_osmsource":
    layerConfig.type = "OSM";
    layerConfig.title = "OpenStreetMap";
    layerConfig.name = "mapnik";
    break;
  default:
    break;
  }
}

function handleOtherTypes(layerConfig, source, layer){
  layerConfig.type = getLayerType(source, layer);
  if (layerConfig.type === "OSM") {
    checkIfHumanitarian(layerConfig);
    layerConfig.title = layer.title;
  } else if (layerConfig.type === "WMS") {
    let params;
    if (source.ptype === "gx_olsource") {
      params = layer.args[2] || {};
      Object.keys(params).forEach((key) => {
        if (params[key].constructor === Array) {
          params[key.toUpperCase()] = params[key].join(",");
          delete params[key];
        }
      });
      layerConfig.url = layer.args[1];
    } else {
      params = {
        LAYERS: layer.name,
        STYLES: layer.styles,
        TILED: "TRUE",
        FORMAT: layer.format || "image/png",
        TRANSPARENT: layer.transparent || "TRUE"
      };
      if (layer.tiled === false) {
        layerConfig.singleTile = true;
      }
      layerConfig.id = layer.name;
      layerConfig.name = layer.name;
      layerConfig.title = layer.titleAlias || layer.title;
      layerConfig.maskings = layer.maskings;
      // TODO not sure if this is the best place to do this?
      layerConfig.url = source.url.replace("http://mapstory.org/geoserver/", "/geoserver/");
    }
    layerConfig.params = params;
    layerConfig.params.VERSION = "1.1.1";
    if (layer.capability) {
      layerConfig.latlonBBOX = layer.capability.llbbox;
      // TODO require dependency explicitly?
      const times = storytools.core.time.maps.readCapabilitiesTimeDimensions(layer.capability, true);
      if (times !== undefined) {
        layerConfig.times = times;
      }
      // info for custom tileGrid
      if (layer.capability.tileSets) {
        Object.keys(layer.capability.tileSets[0].bbox).forEach((srs) => {
          layerConfig.bbox = layer.capability.tileSets[0].bbox[srs].bbox;
        });
        layerConfig.resolutions = layer.capability.tileSets[0].resolutions;
      }
    }
  }
}

function convert(layer, data) {
  const source = data.sources[layer.source];
  const layerConfig = {
    visibility: layer.visibility,
    group: layer.group
  };

  handleBasicSourceTypes(source, layerConfig, layer);

  if (source.ptype === "gx_olsource" || source.ptype === "gxp_wmscsource") {
    handleOtherTypes(layerConfig, source, layer);
  }
  return layerConfig;
}



export default function MapConfigTransformer(data) {
  const layers = [];
  let i, ii, mode = "instant";
  // look for playback mode in tools
  if (data.tools) {
    for (i=0, ii=data.tools.length; i<ii; ++i) {
      const tool = data.tools[i];
      if (tool.ptype === "gxp_playback" && tool.outputConfig) {
        if (tool.outputConfig.playbackMode === "cumulative") {
          mode = "cumulative";
        }
        // TODO other modes
      }
    }
  }
  for (i=0, ii=data.map.layers.length; i<ii; ++i) {
    const layer = data.map.layers[i];

    if (layer.visibility === true) {
      const converted = convert(layer, data);
      if (converted) {
        layers.push(converted);
      }
    }
    // TODO for the editor we also need the invisible layers
  }
  return {
    id: data.id,
    playbackMode: mode,
    map: {
      center: data.map.center,
      projection: data.map.projection,
      zoom: data.map.zoom,
      layers
    }
  };
};
