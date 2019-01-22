import SLDStyleConverter from "../utils/SLDStyleConverter";

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
    svc.currentLayer = null;

    if (!layer) {
      return Promise.resolve(true);
    }

    const layerName = layer.get("name");
    const styleName = layer.get("styleName") || window.getStyleName(layerName);
    const mapID = stateSvc.config.id;

    if (mapID) {
      return fetch(`/style/${mapID}/${styleName}`).then(response => {
        if (!response.ok) {
          svc.currentLayer = layer;
          return false;
        }
        return response.json().then(json => {
          // Need to set this to true, otherwise the style gets overridden with the default
          json.style.readOnly = true;
          layer.set("style", json.style);
          svc.currentLayer = layer;
          svc.updateStyle(layer);
        });
      });
    }

    // if there is no map id, check if there is a style in the state service
    const layerStyle = stateSvc.config.chapters[
      stateSvc.getChapterIndex()
    ].layers.find(item => item.styleName === styleName);

    if (layerStyle) {
      const newStyle = layerStyle.styleConfig.style;
      newStyle.readOnly = true;
      layer.set("style", newStyle);
      svc.currentLayer = layer;
      svc.updateStyle(layer);
    } else {
      svc.currentLayer = layer;
    }

    return Promise.resolve(true);
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
    const mapID = stateSvc.config.id;
    const isComplete = new storytools.edit.StyleComplete.StyleComplete().isComplete(
      style
    );
    if (style.name) {
      if (isComplete) {
        const sld = new SLDStyleConverter();
        const xml = sld.generateStyle(
          style,
          `geonode:${layerSource.getParams().LAYERS}`,
          true
        );
        const csrfToken = $cookies.getAll().csrftoken;
        // @TODO: Use GET request to verify existence of style before POST

        fetch(`/gs/rest/styles?name=${style.name}`, {
          method: "POST",
          body: xml,
          headers: {
            "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8",
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest"
          }
        }).then(response => {
          if (response.status === 403 || response.status === 500) {
            fetch(`/gs/rest/styles/${style.name}.xml`, {
              method: "PUT",
              body: xml,
              headers: {
                "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8",
                "X-CSRFToken": window.mapstory.composer.config.csrfToken,
                "X-Requested-With": "XMLHttpRequest"
              }
            }).then(putResponse => {
              layerSource.updateParams({
                _dc: new Date().getTime(),
                _olSalt: Math.random(),
                STYLES: style.name
              });
              stateSvc.updateLayerStyle(layerName, style.name, {
                style,
                version: "1.0"
              });
            });
          } else {
            layerSource.updateParams({
              _dc: new Date().getTime(),
              _olSalt: Math.random(),
              STYLES: style.name
            });
            stateSvc.updateLayerStyle(layerName, style.name, {
              style,
              version: "1.0"
            });
          }
        });

        if (mapID) {
          fetch(`/style/${mapID}/${styleName}`, {
            method: "POST",
            body: JSON.stringify({ style, version: "1.0" }),
            headers: {
              "X-CSRFToken": window.mapstory.composer.config.csrfToken
            }
          });
        }
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
