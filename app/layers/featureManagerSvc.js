function featureManagerSvc($rootScope, $http, $translate, $q, timeSvc, stateSvc) {
  var svc = {};

  svc.storyPinLayerMetadata = {
    StoryPinLayer: true,
    title: 'Story Pins',
    config: {}
  };

  svc.vectorEditLayerMetadata = {
    vectorEditLayer: true
  };

  svc.createVectorLayer = function(metadata) {
    return new ol.layer.Vector({
      metadata: metadata,
      source: new ol.source.Vector({
        parser: null
      }),
      style: function(feature, resolution) {
        return [new ol.style.Style({
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
        })];
      }
    });
  };

  return svc;
}

module.exports = featureManagerSvc;
