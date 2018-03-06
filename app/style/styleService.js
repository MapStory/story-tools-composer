function styleService($http, ol3StyleConverter, stEditableStoryMapBuilder) {
  const svc = {};

  svc.currentLayer = null;

  svc.setCurrentLayer = layer => {
    svc.currentLayer = layer;
  };

  svc.handleHeatMapStyle = storyLayer => {
    const style = storyLayer.get("style");
    const layer = storyLayer.getLayer();
    if (style.typeName === "heatmap") {
      stEditableStoryMapBuilder.modifyStoryLayer(storyLayer, "HEATMAP");
    } else if (
      style.typeName !== "heatmap" &&
      layer instanceof ol.layer.Heatmap
    ) {
      stEditableStoryMapBuilder.modifyStoryLayer(storyLayer, "VECTOR");
    }
  };

  svc.handleVectorStyle = storyLayer => {
    const style = storyLayer.get("styleName");
    const layer = storyLayer.getLayer();
    layer.setStyle((feature, resolution) =>
      ol3StyleConverter.generateStyle(style, feature, resolution)
    );
  };

  svc.handleCanStyleWMSFalseEvent = storyLayer => {
    // this case will happen if canStyleWMS is false for the server
    const style = storyLayer.get("style");
    const layer = storyLayer.getLayer();
    const isComplete = new storytools.edit.StyleComplete.StyleComplete().isComplete(
      style
    );
    if (storyLayer.get("styleName")) {
      if (isComplete) {
        const sld = new storytools.edit.SLDStyleConverter.SLDStyleConverter();
        const xml = sld.generateStyle(
          style,
          layer.getSource().getParams().LAYERS,
          true
        );
        $http({
          url: `/gslocal/rest/styles/${storyLayer.get("styleName")}.xml`,
          method: "PUT",
          data: xml,
          headers: {
            "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8"
          }
        }).then(() => {
          layer.getSource().updateParams({ _olSalt: Math.random() });
        });
      }
    }
  };

  svc.updateStyle = storyLayer => {
    const style = storyLayer.get("style");
    const layer = storyLayer.getLayer();
    const isComplete = new storytools.edit.StyleComplete.StyleComplete().isComplete(
      style
    );
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
