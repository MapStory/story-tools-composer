/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */
import { Interval, isRangeLike } from "../time/core/utils";
import { filterVectorLayer, readCapabilitiesTimeDimensions } from "../time/core/maps";
import WFSDescribeFeatureType from "../style/WFSDescribeFeatureType";
import MapConfigTransformer from "../mapstory/MapConfigTransformer";


// @todo - provisional default story pins style
const defaultStyle = [
  new ol.style.Style({
    fill: new ol.style.Fill({ color: "rgba(255, 0, 0, 0.1)" }),
    stroke: new ol.style.Stroke({ color: "red", width: 1 }),
    image: new ol.style.Circle({
      radius: 10,
      fill: new ol.style.Fill({ color: "rgba(255, 0, 0, 0.1)" }),
      stroke: new ol.style.Stroke({ color: "red", width: 1 })
    })
  })
];

$("#map .metric-scale-line").css("bottom", "-=40px");
$("#map .imperial-scale-line").css("bottom", "-=40px");
$("#map .nautical-scale-line").css("bottom", "-=40px");
$("#map .ol-mouse-position").css("bottom", "-=40px");
$("#switch-coords-border").css("bottom", "-=40px");


function StoryLayer(data) {
  const layerParams = data.params || {};
  layerParams.style = data.style || defaultStyle;

  if (data.times && isRangeLike(data.times)) {
    data.times = new Interval(data.times);
  }
  ol.Object.call(this, data);
  let layer;
  if (this.get("type") === "VECTOR") {
    const vectorSource = new ol.source.Vector({});

    if (data.cluster) {
      layerParams.source = new ol.source.Cluster({
        distance: 20,
        source: vectorSource
      });
    } else {
      layerParams.source = vectorSource;
    }

    layer = new ol.layer.Vector(layerParams);

    if (data.animate) {
      window.setInterval(() => {
        vectorSource.dispatchEvent("change");
      }, 1000 / 75);
    }
  } else if (this.get("type") === "HEATMAP") {
    layer = new ol.layer.Heatmap({
      radius: data.style.radius,
      opacity: data.style.opacity,
      source: new ol.source.Vector()
    });
  } else if (this.get("type") === "WMS") {
    const config = {
      useOldAsInterimTiles: true
    };
    if (this.get("singleTile") === true) {
      layer = new ol.layer.Image(config);
    } else {
      layer = new ol.layer.Tile(config);
    }
  } else {
    layer = data.layer;
  }
  this.params = layerParams;
  this.layer_ = layer;
}

StoryLayer.prototype = Object.create(ol.Object.prototype);
StoryLayer.prototype.constructor = StoryLayer;

StoryLayer.prototype.getStoryMap = function getStoryMap() {
  return this.storyMap_;
};

StoryLayer.prototype.setWMSSource = function setWMSSource() {
  const layer = this.getLayer();
  const name = this.get("name");
  const times = this.get("times");
  const singleTile = this.get("singleTile");
  const prms = {
    LAYERS: name,
    VERSION: "1.1.0",
    TILED: true
  };
  const params = $.extend(this.get("params"), prms) || prms;
  if (times) {
    params.TIME = new Date(times.start || times[0]).toISOString();
  }
  if (singleTile) {
    layer.setSource(
      new ol.source.ImageWMS({
        params,
        url: this.get("url"),
        serverType: "geoserver"
      })
    );
  } else {
    let tileGrid;
    const
      resolutions = this.get("resolutions"),
      bbox = this.get("bbox");
    if (resolutions && bbox) {
      tileGrid = new ol.tilegrid.TileGrid({
        extent: bbox,
        resolutions
      });
    }
    // @todo use urls for subdomain loading
    layer.setSource(
      new ol.source.TileWMS({
        url: this.get("url"),
        params,
        tileGrid,
        serverType: "geoserver"
      })
    );
  }
};

StoryLayer.prototype.getState = function getState() {
  const state = this.getProperties();
  delete state.features;
  return state;
};

StoryLayer.prototype.getLayer = function getLayer() {
  return this.layer_;
};

StoryLayer.prototype.setLayer = function setLayer(layer) {
  if (this.layer_ && this.storyMap_) {
    const map = this.storyMap_.map_;
    const idx = map
      .getLayers()
      .getArray()
      .indexOf(this.layer_);
    map.getLayers().setAt(idx, layer);
  }
  this.layer_ = layer;
};

function StoryMap(data) {
  ol.Object.call(this, data);
  this.map_ = new ol.Map({
    target: data.target,
    pixelRatio: 1,
    controls: ol.control.defaults().extend([
      /* new ol.control.ZoomSlider(), */
      new ol.control.MousePosition({
        projection: "EPSG:4326",
        coordinateFormat: ol.coordinate.toStringHDMS
      }),
      /*
      new ol.control.ScaleLine({className: 'metric-scale-line ol-scale-line',
        units: ol.control.ScaleLineUnits.METRIC}),
      */
      new ol.control.ScaleLine({
        className: "imperial-scale-line ol-scale-line",
        units: ol.control.ScaleLineUnits.IMPERIAL
      })
      /* ,
            nauticalScale
            */
    ])
  });
  this.overlay = new ol.layer.Vector({
    map: this.map_,
    style: defaultStyle
  });

  if (data.overlayElement) {
    this.map_.addOverlay(
      new ol.Overlay({
        element: data.overlayElement,
        stopEvent: true
      })
    );
  }
  this.title = "Default Mapstory";
  this.abstract = "No Information Supplied.";
  this.owner = "";
  this.mode = "instant";
  this.returnToExtent = data.returnToExtent || false;
  this.center = [0, 0];
  this.zoom = 2;
  this.storyLayers_ = new ol.Collection();
  this.animationDuration_ = data.animationDuration || 500;
  this.storyBoxesLayer = new StoryLayer({
    timeAttribute: "start_time",
    endTimeAttribute: "end_time",
    layer: new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: defaultStyle
    })
  });
  this.storyPinsLayer = new StoryLayer({
    timeAttribute: "start_time",
    endTimeAttribute: "end_time",
    layer: new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: defaultStyle
    })
  });
  this.addStoryPinsLayer();
  this.addStoryBoxesLayer();
}

StoryMap.prototype = Object.create(ol.Object.prototype);
StoryMap.prototype.constructor = StoryMap;

StoryMap.prototype.addStoryPinsLayer = function addStoryPinsLayer() {
  this.map_.addLayer(this.storyPinsLayer.getLayer());
};

StoryMap.prototype.addStoryBoxesLayer = function addStoryBoxesLayer() {
  this.map_.addLayer(this.storyBoxesLayer.getLayer());
};

StoryMap.prototype.setStoryOwner = function setStoryOwner(storyOwner) {
  this.owner = storyOwner;
};

StoryMap.prototype.getStoryOwner = function setStoryOwner() {
  return this.owner;
};

StoryMap.prototype.getCenter = function getCenter() {
  return this.center;
};

StoryMap.prototype.getZoom = function getZoom() {
  return this.zoom;
};

StoryMap.prototype.setStoryTitle = function setStoryTitle(storyTitle) {
  this.title = storyTitle;
};

StoryMap.prototype.setCenter = function setCenter(center) {
  this.center = center;
};

StoryMap.prototype.setZoom = function setZoom(zoom) {
  this.zoom = zoom;
};

StoryMap.prototype.setMode = function setMode(playbackMode) {
  this.mode = playbackMode;
};

StoryMap.prototype.setStoryAbstract = function setStoryAbstract(storyAbstract) {
  this.abstract = storyAbstract;
};

StoryMap.prototype.getStoryTitle = function getStoryTitle() {
  return this.title;
};

StoryMap.prototype.getStoryAbstract = function getStoryAbstract() {
  return this.abstract;
};

StoryMap.prototype.setBaseLayer = function setBaseLayer(baseLayer) {
  this.set("baselayer", baseLayer);
  this.map_.getLayers().forEach(function layerForeach(lyr) {
    if (lyr.get("group") === "background") {
      this.map_.removeLayer(lyr);
    }
  }, this);
  this.map_.getLayers().insertAt(0, this.get("baselayer"));
};

StoryMap.prototype.addStoryLayer = function addStoryLayer(storyLayer, idx) {
  storyLayer.storyMap_ = this;
  if (idx !== undefined) {
    this.storyLayers_.insertAt(idx, storyLayer);
  } else {
    this.storyLayers_.push(storyLayer);
    idx = this.map_.getLayers().getLength()
  }
  // keep pins layer on top
  this.map_.getLayers().forEach((sl, i) => {
    // If there's a base layer, need to make sure story layer is above it
    if (sl.get("group") === "background") {
      idx += 1;
    }
    // If the to be added layer is higher than a pin or vector, move it down under it
    if (idx > i && (sl === this.storyPinsLayer || sl instanceof ol.layer.Vector)) {
      idx -= 1;
    }
  });
  this.map_.getLayers().insertAt(idx, storyLayer.getLayer());
};

StoryMap.prototype.getStoryLayers = function getStoryLayers() {
  return this.storyLayers_;
};

StoryMap.prototype.getMap = function getMap() {
  return this.map_;
};

StoryMap.prototype.clear = function clear() {
  this.map_.getLayers().clear();
  this.storyLayers_.clear();
  this.addStoryPinsLayer();
};

StoryMap.prototype.animatePanAndBounce = function animatePanAndBounce(center, zoom) {
  const duration = 2000;
  const start = +new Date();

  const view = this.map_.getView();

  if (view.getCenter() !== center) {
    const pan = ol.animation.pan({
      duration: this.animationDuration_,
      source: view.getCenter(),
      start
    });

    const bounce = ol.animation.bounce({
      duration,
      resolution: 2 * view.getResolution(),
      start
    });

    this.map_.beforeRender(pan, bounce);

    view.setCenter(center);
    view.setZoom(zoom);
  }
};

StoryMap.prototype.animateCenterAndZoom = function animateCenterAndZoom(center, zoom) {
  const view = this.map_.getView();
  if (view.getCenter() !== center || view.getZoom() !== zoom) {
    this.map_.beforeRender(
      ol.animation.pan({
        duration: this.animationDuration_,
        source: view.getCenter()
      })
    );
    view.setCenter(center);
    this.map_.beforeRender(
      ol.animation.zoom({
        resolution: view.getResolution(),
        duration: this.animationDuration_
      })
    );
    view.setZoom(zoom);
  }
};

StoryMap.prototype.setAllowPan = function setAllowPan(allowPan) {
  this.map_.getInteractions().forEach((i) => {
    if (
      i instanceof ol.interaction.KeyboardPan ||
        i instanceof ol.interaction.DragPan
    ) {
      i.setActive(allowPan);
    }
  });
};

StoryMap.prototype.setAllowZoom = function setAllowZoom(allowZoom) {
  let zoomCtrl;
  this.map_.getControls().forEach((c) => {
    if (c instanceof ol.control.Zoom) {
      zoomCtrl = c;
    }
  });
  if (!allowZoom) {
    this.map_.removeControl(zoomCtrl);
  } else {
    this.map_.addControl(new ol.control.Zoom());
  }
  this.map_.getInteractions().forEach((i) => {
    if (
      i instanceof ol.interaction.DoubleClickZoom ||
        i instanceof ol.interaction.PinchZoom ||
        i instanceof ol.interaction.DragZoom ||
        i instanceof ol.interaction.MouseWheelZoom
    ) {
      i.setActive(allowZoom);
    }
  });
};

StoryMap.prototype.toggleStoryLayer = function toggleStoryLayer(storyLayer) {
  const layer = storyLayer.getLayer();
  storyLayer.set("visibility", !layer.getVisible());
  layer.setVisible(!layer.getVisible());
};



function EditableStoryMap(data) {
  StoryMap.call(this, data);
}

EditableStoryMap.prototype = Object.create(StoryMap.prototype);
EditableStoryMap.prototype.constructor = EditableStoryMap;

EditableStoryMap.prototype.getState = function getState() {
  const config = {};
  config.map = {
    center: this.map_.getView().getCenter(),
    projection: this.map_
      .getView()
      .getProjection()
      .getCode(),
    zoom: this.map_.getView().getZoom(),
    layers: []
  };
  const mapId = this.get("id");
  if (mapId >= 0) {
    config.id = mapId;
  }
  const baseLayer = this.get("baselayer");
  if (baseLayer) {
    const baseLayerState = this.get("baselayer").get("state");
    baseLayerState.group = "background";
    baseLayerState.visibility = true;
    config.map.layers.push(baseLayerState);
  }
  this.storyLayers_.forEach((storyLayer) => {
    config.map.layers.push(storyLayer.getState());
  });
  return config;
};

EditableStoryMap.prototype.removeStoryLayer = function removeStoryLayer(storyLayer) {
  this.storyLayers_.remove(storyLayer);
  this.map_.removeLayer(storyLayer.getLayer());
};

function EditableStoryLayer(data) {
  StoryLayer.call(this, data);
}

EditableStoryLayer.prototype = Object.create(StoryLayer.prototype);
EditableStoryLayer.prototype.constructor = EditableStoryLayer;

const stAnnotateLayer = ($rootScope) => ({
  loadCapabilities(storyLayer, map) {
    const request = "GetCapabilities",
      service = "WMS";
    // always use the virtual service for GetCapabilities
    let url = storyLayer.get("url");
    if (url === "/geoserver/wms") {
      const name = storyLayer.get("name");
      const parts = name.split(":");
      url = url.replace(
        "/geoserver",
        `/geoserver/${  parts[0]  }/${  parts[1]}`
      );
    }
    url = url.replace("http:", "");
    $rootScope.$broadcast("layer-status", {
      name: storyLayer.get("name"),
      phase: "capabilities",
      status: "loading"
    });

    return fetch(`${url}?REQUEST=${request}&SERVICE=${service}&VERSION=1.3.0&TILED=true`)
      .then(rawResponse => {
        if (!rawResponse.ok) {
          return null;
        }
        return rawResponse.text().then(response => {
          const parser = new ol.format.WMSCapabilities();
          const caps = parser.read(response);
          const layer = caps.Capability.Layer.Layer[0];
          if (layer.EX_GeographicBoundingBox) {
            const extent = ol.proj.transformExtent(
              layer.EX_GeographicBoundingBox,
              "EPSG:4326",
              map.getView().getProjection()
            );
            storyLayer.set("extent", extent);
          }
          const found = readCapabilitiesTimeDimensions(
            caps
          );
          const name = storyLayer.get("name");
          if (name in found) {
            storyLayer.set("times", found[name]);
          }

          $rootScope.$broadcast("layer-status", {
            name: storyLayer.get("name"),
            phase: "capabilities",
            status: "done"
          });
        });
      })
      .catch(response => {
      });
  },
  describeFeatureType(storyLayer) {
    const me = this;
    const request = "DescribeFeatureType",
      service = "WFS";
    const id = storyLayer.get("id");
    $rootScope.$broadcast("layer-status", {
      name: storyLayer.get("name"),
      phase: "featureType",
      status: "loading"
    });
    let url = storyLayer.get("url").replace("http:", "");
    url += `?SERVICE=${service}&VERSION=1.0.0&REQUEST=${request}&TYPENAME=${id}&outputFormat=application/json`;

    return fetch(url)
      .then(rawResponse => {
        if (!rawResponse.ok) {
          return null;
        }
        return rawResponse.json().then(response => {
          const parser = WFSDescribeFeatureType();
          if (parser) {
            const layerInfo = parser.parseResult(response);
            if (layerInfo.timeAttribute) {
              storyLayer.set("timeAttribute", layerInfo.timeAttribute);
            } else if (storyLayer.get("timeEndpoint")) {
              me.getTimeAttribute(storyLayer);
            }
            const parts = id.split(":");
            storyLayer.set("typeName", parts[1]);
            storyLayer.set("featurePrefix", parts[0]);
            storyLayer.set("featureNS", "http://www.geonode.org/");
            storyLayer.set("geomType", layerInfo.geomType);
            storyLayer.set("attributes", layerInfo.attributes);
          }
          $rootScope.$broadcast("layer-status", {
            name: storyLayer.get("name"),
            phase: "featureType",
            status: "done"
          });
        });
      })
      .catch(response => {
      });
  },
  getTimeAttribute(storyLayer) {
    return fetch(storyLayer.get("timeEndpoint")).then(rawResponse => {
      if (!rawResponse.ok) {
        return null;
      }
      return rawResponse.json().then(response => {
        storyLayer.set("timeAttribute", response.attribute);
        if (response.endAttribute) {
          storyLayer.set("endTimeAttribute", response.endAttribute);
        }
      });
    }).catch(response  => {
    });
  },
  getStyleName(storyLayer) {
    if (storyLayer.get("canStyleWMS")) {
      return fetch(
        `${storyLayer.get("path") 
        }rest/layers/${ 
          storyLayer.get("id") 
        }.json`
      )
        .then(rawResponse => {
          if (!rawResponse.ok) {
            return null;
          }
          return rawResponse.json().then(response => {
            storyLayer.set(
              "styleName",
              response.layer.defaultStyle.name
            );
          });
        })
        .catch(response =>{});
    }
    return Promise.resolve("");

  },
  getFeatures(storyLayer, map) {
    const name = storyLayer.get("id");
    const cql = storyLayer.get("cql");
    let wfsUrl =
          `${storyLayer.get("url") 
          }?service=WFS&version=1.1.0&request=GetFeature&typename=${ 
            name 
          }&outputFormat=application/json` +
          `&srsName=${ 
            map
              .getView()
              .getProjection()
              .getCode()}`;

    if (cql) {
      wfsUrl += `&cql_filter=${  cql}`;
    }

    wfsUrl += `&t=${  new Date().getTime()}`;

    $rootScope.$broadcast("layer-status", {
      name: storyLayer.get("name"),
      phase: "features",
      status: "loading"
    });

    return fetch(wfsUrl)
      .then(rawResponse => {
        if (!rawResponse.ok) {
          return null;
        }
        rawResponse.json().then((response) => {
          const layer = storyLayer.getLayer();
          const filter = storyLayer.get("filter");
          let features = new ol.format.GeoJSON().readFeatures(response);

          if (filter) {
            features = filter(features);
          }

          storyLayer.set("features", features);

          if (layer.getSource() instanceof ol.source.Cluster) {
            layer
              .getSource()
              .getSource()
              .clear(true);
            layer
              .getSource()
              .getSource()
              .addFeatures(features);
          } else if (layer.getSource() instanceof ol.source.Vector) {
            layer.getSource().clear(true);
            layer.getSource().addFeatures(features);
          }

          $rootScope.$broadcast("layer-status", {
            name: storyLayer.get("name"),
            phase: "features",
            status: "done"
          });
        });
        return true;
      })
      .catch(response => {
      });
  }
});

const stBaseLayerBuilder = () => ({
  buildLayer(data) {
    if (data.type === "MapQuest") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.MapQuest({ layer: data.layer })
      });
    }
    if (data.type === "ESRI") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.XYZ({
          attributions: [
            new ol.Attribution({
              html:
                    'Tiles &copy; <a href="//services.arcgisonline.com/ArcGIS/' +
                    'rest/services/NatGeo_World_Map/MapServer">ArcGIS</a>'
            })
          ],
          url:
                "//server.arcgisonline.com/ArcGIS/rest/services/" +
                "NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
        })
      });
    }
    if (data.type === "HOT") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.OSM({
          attributions: [
            new ol.Attribution({
              html:
                    'Tiles courtesy of <a href="//hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
            }),
            ol.source.OSM.ATTRIBUTION
          ],
          crossOrigin: null,
          url: "//{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        })
      });
    }
    if (data.type === "OSM") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.OSM()
      });
    } else if (data.type === "MapBox") {
      const layer = new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background"
      });
      const name = data.name;
      const urls = [
        "//a.tiles.mapbox.com/v1/mapbox.",
        "//b.tiles.mapbox.com/v1/mapbox.",
        "//c.tiles.mapbox.com/v1/mapbox.",
        "//d.tiles.mapbox.com/v1/mapbox."
      ];
      const tileUrlFunction = function tileUrl(tileCoord) {
        const zxy = tileCoord;
        if (zxy[1] < 0 || zxy[2] < 0) {
          return "";
        }
        return (
          `${urls[Math.round(Math.random() * 3)] +
              name 
          }/${ 
            zxy[0].toString() 
          }/${ 
            zxy[1].toString() 
          }/${ 
            zxy[2].toString() 
          }.png`
        );
      };
      layer.setSource(
        new ol.source.TileImage({
          wrapX: true,
          crossOrigin: null,
          attributions: [
            new ol.Attribution({
              html: /^world/.test(name) ? "<a href='//mapbox.com'>MapBox</a> | Some Data &copy; OSM CC-BY-SA | <a href='//mapbox.com/tos'>Terms of Service</a>": "<a href='//mapbox.com'>MapBox</a> | <a href='//mapbox.com/tos'>Terms of Service</a>"
            })
          ],
          tileGrid: new ol.tilegrid.TileGrid({
            origin: [-128 * 156543.03390625, -128 * 156543.03390625],
            resolutions: [
              156543.03390625,
              78271.516953125,
              39135.7584765625,
              19567.87923828125,
              9783.939619140625,
              4891.9698095703125,
              2445.9849047851562,
              1222.9924523925781,
              611.4962261962891,
              305.74811309814453,
              152.87405654907226,
              76.43702827453613,
              38.218514137268066,
              19.109257068634033,
              9.554628534317017,
              4.777314267158508,
              2.388657133579254,
              1.194328566789627,
              0.5971642833948135
            ]
          }),
          tileUrlFunction
        })
      );
      return layer;
    }
    if (data.type === "WMS") {
      return new ol.layer.Tile({
        group: "background",
        source: new ol.source.TileWMS({
          url: data.url,
          params: data.params
        })
      });
    }
    throw new Error(`no type for : ${  JSON.stringify(data)}`);
  }
});

const stEditableLayerBuilder = (stAnnotateLayer) => ({
  buildEditableLayer(data, map) {
    const layer = new EditableStoryLayer(data);
    const promises = [];
    // TODO add this back when we have WMS-C GetCaps
    const needsCaps = !(
      data.latlonBBOX && data.times
    );
    if (needsCaps) {
      promises.push(stAnnotateLayer.loadCapabilities(layer, map));
    }
    const needsDFT = !data.attributes;
    if (needsDFT) {
      promises.push(stAnnotateLayer.describeFeatureType(layer));
    }
    if (
      (data.type === "VECTOR" || data.type === "HEATMAP") &&
          !data.features
    ) {
      promises.push(stAnnotateLayer.getFeatures(layer, map));
    } else {
      promises.push(stAnnotateLayer.getStyleName(layer));
    }
    return Promise.all(promises).then(
      () => {
        // this needs to be done here when everything is resolved
        if (layer.get("features")) {
          const times = layer.get("times");
          if (times) {
            const start = times.start || times[0];
            filterVectorLayer(layer, {
              start,
              end: start
            });
          } else {
            layer
              .getLayer()
              .getSource()
              .addFeatures(layer.get("features"));
          }
        } else {
          layer.setWMSSource();
        }
        return Promise.resolve(layer);
      },
      (...rest) => Promise.reject(rest)
    );
  }
});


const stLayerBuilder = () => ({
  buildLayer(data) {
    const layer = new StoryLayer(data);
    layer.setWMSSource();
    return Promise.resolve(layer);
  }
});

const stStoryMapBaseBuilder = ($rootScope, $compile, stBaseLayerBuilder) => ({
  defaultMap(storymap) {
    storymap
      .getMap()
      .setView(
        new ol.View({ center: [0, 0], zoom: 3, minZoom: 3, maxZoom: 16 })
      );
    this.setBaseLayer(storymap, {
      title: "World Topo Map",
      type: "ESRI",
      name: "world-topo-map"
    });
  },
  setBaseLayer(storymap, data) {
    const baseLayer = stBaseLayerBuilder.buildLayer(data);
    storymap.setBaseLayer(baseLayer);
  }
});

const stStoryMapBuilder = ($rootScope, $compile, stLayerBuilder, stStoryMapBaseBuilder) => ({
  modifyStoryMap(storymap, data) {
    storymap.clear();
    const mapConfig = MapConfigTransformer(
      data
    );
    if (mapConfig.id >= 0) {
      storymap.set("id", mapConfig.id);
      storymap.setMode(mapConfig.playbackMode);
      if (data.about !== undefined) {
        storymap.setStoryTitle(data.about.title);
        storymap.setStoryAbstract(data.about.abstract);
        storymap.setStoryOwner(data.about.owner);
      }

      storymap.setCenter(mapConfig.map.center);
      storymap.setZoom(mapConfig.map.zoom);
    }
    for (let i = 0, ii = mapConfig.map.layers.length; i < ii; ++i) {
      const layerConfig = mapConfig.map.layers[i];
      if (
        layerConfig.group === "background" &&
            layerConfig.visibility === true
      ) {
        stStoryMapBaseBuilder.setBaseLayer(storymap, layerConfig);
      } else {
        /* jshint loopfunc: true */
        stLayerBuilder
          .buildLayer(layerConfig, storymap.getMap())
          .then(((index, sl) => {
            storymap.addStoryLayer(sl, index);
          }).bind(this, i));
      }
    }
    storymap.getMap().setView(
      new ol.View({
        center: mapConfig.map.center,
        zoom: mapConfig.map.zoom,
        minZoom: 3,
        maxZoom: 17
      })
    );
  }
});

const stEditableStoryMapBuilder = ($rootScope, $compile, stStoryMapBaseBuilder, stEditableLayerBuilder) => ({
  modifyStoryLayer(storylayer, newType) {
    const data = storylayer.getProperties();
    const storymap = storylayer.getStoryMap();
    data.type = newType || (data.type === "WMS" ? "VECTOR" : "WMS");
    if (data.type === "WMS") {
      delete data.features;
    }
    return stEditableLayerBuilder
      .buildEditableLayer(data, storymap.getMap())
      .then((sl) => {
        // sequence is important here, first change layer, then the type.
        storylayer.setLayer(sl.getLayer());
        storylayer.set("type", sl.get("type"));
      });
  },
  modifyStoryMap(storymap, data) {
    storymap.clear();
    const mapConfig = MapConfigTransformer(
      data
    );
    if (mapConfig.id >= 0) {
      storymap.set("id", mapConfig.id);
      storymap.setMode(mapConfig.playbackMode);
      if (data.about !== undefined) {
        storymap.setStoryTitle(data.about.title);
        storymap.setStoryAbstract(data.about.abstract);
        storymap.setStoryOwner(data.about.owner);
      }
    }
    for (let i = 0, ii = mapConfig.map.layers.length; i < ii; ++i) {
      const layerConfig = mapConfig.map.layers[i];
      if (
        layerConfig.group === "background" &&
            layerConfig.visibility === true
      ) {
        stStoryMapBaseBuilder.setBaseLayer(storymap, layerConfig);
      } else {
        /* jshint loopfunc: true */
        stEditableLayerBuilder
          .buildEditableLayer(layerConfig, storymap.getMap())
          .then((sl) => {
            // TODO insert at the correct index
            storymap.addStoryLayer(sl);
          });
      }
    }

    storymap.getMap().setView(
      new ol.View({
        center: mapConfig.map.center,
        zoom: mapConfig.map.zoom,
        projection: mapConfig.map.projection,
        minZoom: 3,
        maxZoom: 17
      })
    );
  }
});

ol.Overlay.Popup = function overlayPopup(opt_options) {
  const options = opt_options || {};

  this.panMapIfOutOfView = options.panMapIfOutOfView;
  if (this.panMapIfOutOfView === undefined) {
    this.panMapIfOutOfView = true;
  }

  this.ani = options.ani;
  if (this.ani === undefined) {
    this.ani = ol.animation.pan;
  }

  this.ani_opts = options.ani_opts;
  if (this.ani_opts === undefined) {
    this.ani_opts = { duration: 250 };
  }

  this.container = document.createElement("div");
  this.container.className = "ol-popup";
  this.container.id = (options.id !== null && options.id !== undefined) ? options.id : "";

  this.closer = document.createElement("a");
  this.closer.className = "ol-popup-closer";
  this.closer.href = "#";
  this.container.appendChild(this.closer);

  const that = this;
  this.closer.addEventListener(
    "click",
    (evt) => {
      that.container.style.display = "none";
      that.closer.blur();
      evt.preventDefault();
    },
    false
  );

  this.content = document.createElement("div");
  this.content.className = "ol-popup-content";
  this.container.appendChild(this.content);

  ol.Overlay.call(this, {
    id: (options.id !== undefined && options.id !== null) ? options.id : "popup",
    element: this.container,
    positioning: (options.positioning !== null && options.positioning !== undefined) ? options.positioning : "top-left",
    stopEvent: (options.stopEvent !== null && options.stopEvent !== undefined) ? options.stopEvent : true,
    insertFirst: (options.insertFirst !== null && options.insertFirst !== undefined) ? options.insertFirst : true
  });
};

ol.inherits(ol.Overlay.Popup, ol.Overlay);

ol.Overlay.Popup.prototype.getId = function getId() {
  return this.container.id;
};

ol.Overlay.Popup.prototype.show = function popupShow(coord, html) {
  this.setPosition(coord);
  if (html instanceof HTMLElement) {
    this.content.innerHTML = "";
    this.content.appendChild(html);
  } else {
    this.content.innerHTML = html;
  }
  this.container.style.display = "block";
  if (this.panMapIfOutOfView) {
    this.panIntoView_(coord);
  }
  this.content.scrollTop = 0;
  return this;
};

/**
   * @private
   */
ol.Overlay.Popup.prototype.panIntoView_ = function popupPanIntoView(coord) {
  const popSize = {
      width: this.getElement().clientWidth + 20,
      height: this.getElement().clientHeight + 20
    },
    mapSize = this.getMap().getSize();

  const tailHeight = 20,
    tailOffsetLeft = 60,
    tailOffsetRight = popSize.width - tailOffsetLeft,
    popOffset = this.getOffset(),
    popPx = this.getMap().getPixelFromCoordinate(coord);

  const fromLeft = popPx[0] - tailOffsetLeft,
    fromRight = mapSize[0] - (popPx[0] + tailOffsetRight);

  const fromTop = popPx[1] - popSize.height + popOffset[1],
    fromBottom = mapSize[1] - (popPx[1] + tailHeight) - popOffset[1];

  const center = this.getMap()
      .getView()
      .getCenter(),
    curPx = this.getMap().getPixelFromCoordinate(center),
    newPx = curPx.slice();

  if (fromRight < 0) {
    newPx[0] -= fromRight;
  } else if (fromLeft < 0) {
    newPx[0] += fromLeft;
  }

  if (fromTop < 0) {
    newPx[1] += fromTop;
  } else if (fromBottom < 0) {
    newPx[1] -= fromBottom;
  }

  if (this.ani && this.ani_opts) {
    this.ani_opts.source = center;
    this.getMap().beforeRender(this.ani(this.ani_opts));
  }

  if (newPx[0] !== curPx[0] || newPx[1] !== curPx[1]) {
    this.getMap()
      .getView()
      .setCenter(this.getMap().getCoordinateFromPixel(newPx));
  }

  return this.getMap()
    .getView()
    .getCenter();
};

/**
   * Hide the popup.
   */
ol.Overlay.Popup.prototype.hide = function popupHide() {
  this.container.style.display = "none";
  return this;
};

/**
   * Indicates if the popup is in open state
   */
ol.Overlay.Popup.prototype.isOpened = function popupIsOpened() {
  return this.container.style.display === "block";
};


export {
  StoryMap,
  EditableStoryMap,
  StoryLayer,
  EditableStoryLayer,
  stAnnotateLayer,
  stBaseLayerBuilder,
  stEditableLayerBuilder,
  stLayerBuilder,
  stStoryMapBaseBuilder,
  stStoryMapBuilder,
  stEditableStoryMapBuilder
}
