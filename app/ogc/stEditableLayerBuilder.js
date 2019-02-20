import EditableStoryLayer from "./EditableStoryLayer";
import { filterVectorLayer } from "../time/core/maps";


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

export default stEditableLayerBuilder;