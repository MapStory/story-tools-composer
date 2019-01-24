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
    // TODO for the editor we also need the invisible layers
    if (layer.visibility === true) {
      const source = data.sources[layer.source];
      const layerConfig = {
        visibility: layer.visibility,
        group: layer.group
      };
      if (source.ptype === "gxp_mapquestsource") {
        layerConfig.type = "MapQuest";
        layerConfig.layer = layer.name === "naip" ? "sat" : "osm";
        layerConfig.title = layer.title;
        layers.push(layerConfig);
      } else if (source.ptype === "gxp_mapboxsource") {
        layerConfig.type = "MapBox";
        layerConfig.name = layer.name;
        layerConfig.title = layer.title;
        layers.push(layerConfig);
      } else if (source.ptype === "gxp_osmsource") {
        layerConfig.type = "OSM";
        layerConfig.title = "OpenStreetMap";
        layerConfig.name = "mapnik";
        layers.push(layerConfig);
      } else if (source.ptype === "gx_olsource" || source.ptype === "gxp_wmscsource") {
        layerConfig.type = (source.ptype === "gx_olsource") ? layer.type.replace("OpenLayers.Layer.", "") : "WMS";
        if (layerConfig.type === "OSM") {
          if (layerConfig.args && layerConfig.args[0] === "Humanitarian OpenStreetMap") {
            layerConfig.type = "HOT";
          }
          layerConfig.title = layer.title;
        } else if (layerConfig.type === "WMS") {
          var params;
          if (source.ptype === "gx_olsource") {
            params = layer.args[2] || {};
            for (const key in params) {
              if (params[key].constructor === Array) {
                params[key.toUpperCase()] = params[key].join(",");
                delete params[key];
              }
            }
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
              for (const srs in layer.capability.tileSets[0].bbox) {
                const bbox = layer.capability.tileSets[0].bbox[srs].bbox;
                layerConfig.bbox = bbox;
              }
              layerConfig.resolutions = layer.capability.tileSets[0].resolutions;
            }
          }
        }
        layers.push(layerConfig);
      } else if (window.console) {
        window.console.warn(`Unknown source type in map config: ${  source.ptype}`);
      }
    }
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
