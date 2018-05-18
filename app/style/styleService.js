function styleService(
  $http,
  $cookies,
  ol3StyleConverter,
  stEditableStoryMapBuilder,
  stateSvc
) {
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

  window.getStyleName = name => {
    const composerConfig = window.mapstory.composer.config;
    const idParts = {
      user: composerConfig.username,
      uuid: window.storyUUID,
      chapter: stateSvc.getChapter(),
      layerName: name
    };
    const styleName = `STYLE_${idParts.user}_${idParts.uuid}-${
      idParts.chapter
    }-${idParts.layerName}`;

    return styleName;
  };

  svc.handleCanStyleWMSFalseEvent = storyLayer => {
    const layerName = storyLayer.get("name");
    const styleName =
      storyLayer.get("styleName") || window.getStyleName(layerName);
    // this case will happen if canStyleWMS is false for the server
    const style = storyLayer.get("style");
    style.name = styleName;
    const layer = storyLayer.getLayer();
    const layerSource = layer.getSource();
    const isComplete = new storytools.edit.StyleComplete.StyleComplete().isComplete(
      style
    );
    if (style.name) {
      if (isComplete) {
        const sld = new storytools.edit.SLDStyleConverter.SLDStyleConverter();
        const xml = sld.generateStyle(
          style,
          layerSource.getParams().LAYERS,
          true
        );
        const csrfToken = $cookies.getAll().csrftoken;
        // @TODO: Use GET request to verify existence of style before POST
        $http({
          url: `/gs/rest/styles?name=${  style.name}`,
          method: "POST",
          data: xml,
          headers: {
            "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8",
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest"
          }
        }).then(
          (result) => {
            layerSource.updateParams({
              _dc: new Date().getTime(),
              _olSalt: Math.random(),
              STYLES: style.name
            });
            stateSvc.updateLayerStyle(layerName, style.name);
          },
          (response) => {
            if (response.status === 403 || response.status === 500) {
              $http
                .put(`/gs/rest/styles/${  style.name  }.xml`, xml, {
                  headers: {
                    "Content-Type":
                      "application/vnd.ogc.sld+xml; charset=UTF-8",
                    "X-CSRFToken": csrfToken,
                    "X-Requested-With": "XMLHttpRequest"
                  }
                })
                .then((result) => {
                  layerSource.updateParams({
                    _dc: new Date().getTime(),
                    _olSalt: Math.random(),
                    STYLES: style.name
                  });
                  stateSvc.updateLayerStyle(layerName, style.name);
                });
            }
            // called asynchronously if an error occurs
            // or server returns response with an error status.
          }
        );
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

export default styleService;
