/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */
import {createRange, Interval, getTime, visitRanges, computeRange} from "./utils";

/**
 * Read the provide ol3 WMS capabilities document
 * @param {type} caps
 * @returns an object of name->[date|interval]|interval-range mappings
 */
export function readCapabilitiesTimeDimensions(caps, openlayers2 = false) {
  let dimensions = {};
  function readRange(subparts) {
    if (subparts.length < 2) {
      throw new Error(`expected 2 parts for range : ${  subparts}`);
    }
    let range = createRange(subparts[0], subparts[1]);
    if (subparts.length === 3) {
      range.duration = subparts[2];
      range = new Interval(range);
    }
    return range;
  }
  function readPart(part) {
    const subparts = part.split("/");
    if (subparts.length === 1) {
      return getTime(subparts[0]);
    } 
    return readRange(subparts);
    
  }
  function parse(dimension) {
    const dims = openlayers2 ? dimension : dimension.split(",");
    if (dims.length === 1) {
      const read = readPart(dims[0]);
      return typeof read === "number" ? [read] : read;
    }
    return dims.map(readPart);
  }
  if (openlayers2 === true) {
    if (caps.dimensions && caps.dimensions.time) {
      dimensions = parse(caps.dimensions.time.values);
    } else {
      dimensions = undefined;
    }
  } else {
    caps.Capability.Layer.Layer.forEach((lyr) => {
      const dims = lyr.Dimension || [];
      for (let i = 0; i < dims.length; i++) {
        if (dims[i] && dims[i].name && dims[i].name === "time") {
          dimensions[lyr.Name] = parse(dims[i].values);
        }
      }
    });
  }
  return dimensions;
}

function TileLoadListener(tileStatusCallback) {
  const tilesLoading = {};
  const deferred = $.Deferred();
  let cancelled = false;
  function remainingTiles() {
    let t = 0;
    Array.forEach(Object.values(tilesLoading), (tile) => {
      t += tile;
    });
    return t;
  }
  const listener = {
    deferred,
    cancel() {
      cancelled = true;
      Array.forEach(Object.keys(tilesLoading), (i) => {
        tilesLoading[i] = 0;
      });
      if (deferred) {
        deferred.reject(); // notify we've aborted but w/out error
      }
      if (tileStatusCallback) {
        tileStatusCallback(0);
      }
    },
    tileQueued(source) {
      if (cancelled) {
        return;
      }
      let key;
      if (source instanceof ol.source.TileWMS) {
        key = source.getUrls()[0];
      } else if (source instanceof ol.source.ImageWMS) {
        key = source.getUrl();
      }
      tilesLoading[key] = (tilesLoading[key] || 0) + 1;
      if (tileStatusCallback) {
        tileStatusCallback(remainingTiles());
      }
    },
    tileLoaded(event, source) {
      if (cancelled) {
        return;
      }
      let key;
      if (source instanceof ol.source.TileWMS) {
        key = source.getUrls()[0];
      } else if (source instanceof ol.source.ImageWMS) {
        key = source.getUrl();
      }
      tilesLoading[key] -= 1;
      const remaining = remainingTiles();
      if (tileStatusCallback) {
        tileStatusCallback(remaining);
      }
      if (remaining === 0 && deferred) {
        deferred.resolve();
      }
    }
  };
    // workaround for when the tiles are cached and no events are triggered
    // this adds a constant (small) additional delay to the current play rate
    // under optimal (cached) conditions
    // @todo can this safely be shortened?
  window.setTimeout(() => {
    if (Object.keys(tilesLoading).length === 0) {
      listener.cancel();
    }
  },100);
  return listener;
}

/**
 * Call the provided visitor function on the specified features using the
 * configuration provided in the layer. The visitor function will be called
 * with the feature, and start and end time, if any. The features visited will
 * be, in order of priority: the provided (optional) features argument, the
 * layer property 'features', the layer's source features.
 * @param {StoryLayer} story layer
 * @param {function} visitor function(feature, start, end)
 * @param {array} features (opitonal)
 */
function visitAllLayerFeatureTimes(storyLayer, visitor, features) {
  const startAtt = storyLayer.get("timeAttribute");
  const endAtt = storyLayer.get("endTimeAttribute");
  let rangeGetter;
  const layer = storyLayer.getLayer();
  features = features || storyLayer.get("features") || layer.getSource().getFeatures();
  if (endAtt) {
    rangeGetter = (f) => {
      if(f.range){
        return f.range;
      }
      const start = f.get(startAtt);
      const end = f.get(endAtt);
      return createRange(start, end);

    };
  } else {
    rangeGetter = (f) => {
      if(f.range){
        return f.range;
      }
      const start = f.get(startAtt);
      return createRange(start, start);
    };
  }
  visitRanges(features, rangeGetter, visitor);
}

export function filterVectorLayer(storyLayer, range) {
  const timeAttr = storyLayer.get("timeAttribute"), l_features = storyLayer.get("features") || storyLayer.getLayer().get("features");
  if (timeAttr === undefined || l_features === undefined) {
    return undefined;
  }
  range = createRange(range);
  // loop over all original features and filter them
  const features = [];
  const layer = storyLayer.getLayer();
  visitAllLayerFeatureTimes(storyLayer, (f,r) => {
    if (range.intersects(r)) {
      features.push(f);
    }
  }, l_features);
  layer.getSource().clear(true);
  layer.getSource().addFeatures(features);
  return features;
}


export function filterVectorBoxLayer(storyLayer, range) {
  const timeAttr = storyLayer.get("timeAttribute"), l_features = storyLayer.get("features");
  if (timeAttr === undefined || l_features === undefined) {
    return undefined;
  }
  range = createRange(range);
  // loop over all original features and filter them
  const features = [];
  visitAllLayerFeatureTimes(storyLayer, (f,r) => {
    if (range.intersects(r)) {
      features.push(f);
    }
  });
  return features;
}


/**
 * Compute the range of the provided features using the layer's configured
 * timeattributes. If the optional features array is omitted, the features
 * will come from the layer.
 * @param {StoryLayer} storyLayer
 * @param {array} features (optional)
 * @returns {storytools.core.time.Range} range of features
 */
export function computeVectorRange(storyLayer, features) {
  const startAtt = storyLayer.get("timeAttribute");
  const endAtt = storyLayer.get("endTimeAttribute");
  const layer = storyLayer.getLayer();
  features = features || storyLayer.get("features") || layer.getSource().getFeatures();
  return computeRange(features, (f) => createRange(f.get(startAtt), f.get(endAtt)));
}

export function MapController(options, timeControls) {
  let loadListener = null;
  const tileStatusCallback = options.tileStatusCallback,
    storyMap = options.storyMap;
  function layerAdded(layer) {
    let source;
    const loaded = (event) => {
      // grab the active loadListener to avoid phantom onloads
      // when listener is cancelled
      const currentListener = loadListener;
      if (currentListener) {
        currentListener.tileLoaded(event, source);
      }
    };
    const loadstart = () => {
      // grab the active loadListener to avoid phantom onloads
      // when listener is cancelled
      const currentListener = loadListener;
      if (currentListener) {
        currentListener.tileQueued(source);
      }
    };
    if (layer instanceof ol.layer.Tile && layer.getSource() instanceof ol.source.TileWMS) {
      source = layer.getSource();
      source.on("tileloadstart", loadstart);
      source.on("tileloadend", loaded);
      // @todo handle onerror and cancel deferred with an example
      // to stop automatic playback
      source.on("tileloaderror", loaded);
    } else if (layer instanceof ol.layer.Image && layer.getSource() instanceof ol.source.ImageWMS) {
      source = layer.getSource();
      source.on("imageloadstart", loadstart);
      source.on("imageloadend", loaded);
      source.on("imageloaderror", loaded);
    }
  }
  function createLoadListener() {
    if (loadListener !== null) {
      loadListener.cancel();
    }
    loadListener = new TileLoadListener(tileStatusCallback);
    return loadListener;
  }

  function updateCenterAndZoom(range){
    const currentBoxes = filterVectorBoxLayer(storyMap.storyBoxesLayer, range);
    const currentPinFeatures = filterVectorLayer(storyMap.storyPinsLayer, range);

    if (currentPinFeatures && currentPinFeatures.length > 0) {
      return undefined;
    } else if (currentBoxes && currentBoxes.length > 0) {
      const currentBox = currentBoxes[0];

      if (currentBox.center) {
        storyMap.animateCenterAndZoom(currentBox.center, currentBox.zoom);
      }
    } else if (storyMap.returnToExtent) {
      storyMap.animateCenterAndZoom(storyMap.getCenter(), storyMap.getZoom());
    }
    return undefined;
  }

  function updateLayers(range) {
    const storyLayers = storyMap.getStoryLayers();
    let time = new Date(range.start).toISOString();
    if (range.start !== range.end) {
      time += `/${  new Date(range.end).toISOString()}`;
    }
    for (let i = 0; i < storyLayers.getLength(); i++) {
      const storyLayer = storyLayers.item(i), layer = storyLayer.getLayer();
      if ((layer instanceof ol.layer.Tile && layer.getSource() instanceof ol.source.TileWMS) ||
                  (layer instanceof ol.layer.Image && layer.getSource() instanceof ol.source.ImageWMS)) {
        if (storyLayer.get("times")) {
          layer.getSource().updateParams({TIME: time});
        }
      } else if (layer instanceof ol.layer.Vector) {
        filterVectorLayer(storyLayer, range);
      }
    }
    // this is a non-story layer - not part of the main collection
    filterVectorLayer(storyMap.storyPinsLayer, range);
    if (storyLayers.getLength() >= 1) {
      timeControls.defer(createLoadListener().deferred);
    }
  }
  const me = this;
  me.layers = {};
  storyMap.getStoryLayers().on("add", (ev) => {
    const lyr = ev.element;
    const id = lyr.get("id");
    if (me.layers[id] !== true) {
      layerAdded(lyr.getLayer());
      me.layers[id] = true;
    }
  });
  storyMap.getStoryLayers().forEach((lyr) => {
    const id = lyr.get("id");
    if (id !== undefined && me.layers[id] !== true) {
      layerAdded(lyr.getLayer());
      me.layers[id] = true;
    }
  });
  timeControls.on("rangeChange", updateCenterAndZoom);
  timeControls.on("rangeChange", updateLayers);
}
