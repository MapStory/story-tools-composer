function styleService($http, ol3StyleConverter, stEditableStoryMapBuilder) {
  var svc = {};

  svc.currentLayer = null;

  svc.setCurrentLayer = function(layer) {
    svc.currentLayer = layer;
  };

  svc.handleHeatMapStyle = function(storyLayer) {
    var style = storyLayer.get("style"),
      layer = storyLayer.getLayer();
    if (style.typeName === "heatmap") {
      stEditableStoryMapBuilder.modifyStoryLayer(storyLayer, "HEATMAP");
      return;
    } else if (
      style.typeName !== "heatmap" &&
      layer instanceof ol.layer.Heatmap
    ) {
      stEditableStoryMapBuilder.modifyStoryLayer(storyLayer, "VECTOR");
    }
  };

  svc.handleVectorStyle = function(storyLayer) {
    var style = storyLayer.get("style"),
      layer = storyLayer.getLayer();
    layer.setStyle(function(feature, resolution) {
      return ol3StyleConverter.generateStyle(style, feature, resolution);
    });
  };

  svc.handleCanStyleWMSFalseEvent = function(storyLayer) {
    // this case will happen if canStyleWMS is false for the server
    var style = storyLayer.get("style"),
      layer = storyLayer.getLayer();
    if (storyLayer.get("styleName")) {
      if (isComplete) {
        var sld = new storytools.edit.SLDStyleConverter.SLDStyleConverter();
        var xml = sld.generateStyle(
          style,
          layer.getSource().getParams().LAYERS,
          true
        );
        $http({
          url: "/gslocal/rest/styles/" + storyLayer.get("styleName") + ".xml",
          method: "PUT",
          data: xml,
          headers: {
            "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8"
          }
        }).then(function(result) {
          layer.getSource().updateParams({ _olSalt: Math.random() });
        });
      }
    }
  };

  svc.updateStyle = function(storyLayer) {
    var style = storyLayer.get("style"),
      layer = storyLayer.getLayer();
    var isComplete = new storytools.edit.StyleComplete
      .StyleComplete().isComplete(style);
    svc.handleHeatMapStyle(storyLayer);
    if (isComplete && layer instanceof ol.layer.Vector) {
      svc.handleVectorStyle(storyLayer);
    } else {
      svc.handleCanStyleWMSFalseEvent(storyLayer);
    }
  };

  return svc;
}

module.exports = styleService;
