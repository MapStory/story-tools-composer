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

  window.config.getTempStyleName = storyLayer => {
    const config = window.config;
    const idParts = {
      user: config.about.owner.username,
      slug: config.about.slug,
      chapter: stateSvc.getChapter(),
      layerName: storyLayer.get("name")
    };
    const tempStyleName = `TEMP_${idParts.user}_${idParts.slug}-${
      idParts.chapter
    }-${idParts.layerName}`;
    return tempStyleName;
  };

  svc.handleCanStyleWMSFalseEvent = storyLayer => {
    const tempStyleName = window.config.getTempStyleName(
      storyLayer.get("name")
    );

    // this case will happen if canStyleWMS is false for the server
    const style = storyLayer.get("style");
    style.name = storyLayer.get("styleName");
    const layer = storyLayer.getLayer();
    let layerSource = layer.getSource();
    const isComplete = new storytools.edit.StyleComplete.StyleComplete().isComplete(
      style
    );
    if (storyLayer.get("styleName")) {
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
          url: "/gs/rest/styles?name=" + style.name,
          method: "POST",
          data: xml,
          headers: {
            "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8",
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest"
          }
        }).then(
          function(result) {
            layerSource.updateParams({
              _dc: new Date().getTime(),
              _olSalt: Math.random(),
              STYLES: style.name
            });
          },
          function errorCallback(response) {
            console.log("Style Create Error Response ", response);
            if (response.status === 403 || response.status === 500) {
              $http
                .put("/gs/rest/styles/" + style.name + ".xml", xml, {
                  headers: {
                    "Content-Type":
                      "application/vnd.ogc.sld+xml; charset=UTF-8",
                    "X-CSRFToken": csrfToken,
                    "X-Requested-With": "XMLHttpRequest"
                  }
                })
                .then(function(result) {
                  layerSource.updateParams({
                    _dc: new Date().getTime(),
                    _olSalt: Math.random(),
                    STYLES: style.name
                  });
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

module.exports = styleService;
