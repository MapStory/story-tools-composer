/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import defaultStyle from "./defaultStyle";
import StoryLayer from "./StoryLayer";


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


export default StoryMap;