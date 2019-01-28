/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import { Interval, isRangeLike } from "../time/core/utils";
import defaultStyle from "./defaultStyle";

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

export default StoryLayer;