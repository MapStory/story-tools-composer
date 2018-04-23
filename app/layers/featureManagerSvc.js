function featureManagerSvc() {
  const svc = {};

  svc.storyPinLayerMetadata = {
    StoryPinLayer: true,
    title: "Story Pins",
    config: {}
  };

  svc.vectorEditLayerMetadata = {
    vectorEditLayer: true
  };

  svc.createVectorLayer = metadata => {
    const meta = !metadata ? svc.vectorEditLayerMetadata : metadata;
    return new ol.layer.Vector({
      metadata: meta,
      source: new ol.source.Vector({
        parser: null
      }),
      style(feature, resolution) {
        return [
          new ol.style.Style({
            fill: new ol.style.Fill({
              color: [0, 0, 255, 0.25]
            }),
            stroke: new ol.style.Stroke({
              color: [0, 0, 255, 1],
              width: 4
            }),
            image: new ol.style.Circle({
              radius: 6,
              fill: new ol.style.Fill({
                color: [0, 0, 255, 0.25]
              }),
              stroke: new ol.style.Stroke({
                color: [0, 0, 255, 1],
                width: 1.5
              })
            }),
            zIndex: 1
          })
        ];
      }
    });
  };

  return svc;
}

export default featureManagerSvc;
