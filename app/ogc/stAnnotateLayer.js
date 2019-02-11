import { readCapabilitiesTimeDimensions } from "../time/core/maps";
import WFSDescribeFeatureType from "../style/WFSDescribeFeatureType";

const stAnnotateLayer = ($rootScope) => ({
  loadCapabilities(storyLayer, map) {
    const request = "GetCapabilities",
      service = "WMS";
    // always use the virtual service for GetCapabilities
    let url = storyLayer.get("url");
    if (url === "/geoserver/wms") {
      const name = storyLayer.get("name");
      const parts = name.split(":");
      url = url.replace(
        "/geoserver",
        `/geoserver/${  parts[0]  }/${  parts[1]}`
      );
    }
    url = url.replace("http:", "");
    $rootScope.$broadcast("layer-status", {
      name: storyLayer.get("name"),
      phase: "capabilities",
      status: "loading"
    });

    return fetch(`${url}?REQUEST=${request}&SERVICE=${service}&VERSION=1.3.0&TILED=true`)
      .then(rawResponse => {
        if (!rawResponse.ok) {
          return null;
        }
        return rawResponse.text().then(response => {
          const parser = new ol.format.WMSCapabilities();
          const caps = parser.read(response);
          const layer = caps.Capability.Layer.Layer[0];
          if (layer.EX_GeographicBoundingBox) {
            const extent = ol.proj.transformExtent(
              layer.EX_GeographicBoundingBox,
              "EPSG:4326",
              map.getView().getProjection()
            );
            storyLayer.set("extent", extent);
          }
          const found = readCapabilitiesTimeDimensions(
            caps
          );
          const name = storyLayer.get("name");
          if (name in found) {
            storyLayer.set("times", found[name]);
          }

          $rootScope.$broadcast("layer-status", {
            name: storyLayer.get("name"),
            phase: "capabilities",
            status: "done"
          });
        });
      })
      .catch(response => {
      });
  },
  describeFeatureType(storyLayer) {
    const me = this;
    const request = "DescribeFeatureType",
      service = "WFS";
    const id = storyLayer.get("id");
    $rootScope.$broadcast("layer-status", {
      name: storyLayer.get("name"),
      phase: "featureType",
      status: "loading"
    });
    let url = storyLayer.get("url").replace("http:", "");
    url += `?SERVICE=${service}&VERSION=1.0.0&REQUEST=${request}&TYPENAME=${id}&outputFormat=application/json`;

    return fetch(url)
      .then(rawResponse => {
        if (!rawResponse.ok) {
          return null;
        }
        return rawResponse.json().then(response => {
          const parser = WFSDescribeFeatureType();
          if (parser) {
            const layerInfo = parser.parseResult(response);
            if (layerInfo.timeAttribute) {
              storyLayer.set("timeAttribute", layerInfo.timeAttribute);
            } else if (storyLayer.get("timeEndpoint")) {
              me.getTimeAttribute(storyLayer);
            }
            const parts = id.split(":");
            storyLayer.set("typeName", parts[1]);
            storyLayer.set("featurePrefix", parts[0]);
            storyLayer.set("featureNS", "http://www.geonode.org/");
            storyLayer.set("geomType", layerInfo.geomType);
            storyLayer.set("attributes", layerInfo.attributes);
          }
          $rootScope.$broadcast("layer-status", {
            name: storyLayer.get("name"),
            phase: "featureType",
            status: "done"
          });
        });
      })
      .catch(response => {
      });
  },
  getTimeAttribute(storyLayer) {
    return fetch(storyLayer.get("timeEndpoint")).then(rawResponse => {
      if (!rawResponse.ok) {
        return null;
      }
      return rawResponse.json().then(response => {
        storyLayer.set("timeAttribute", response.attribute);
        if (response.endAttribute) {
          storyLayer.set("endTimeAttribute", response.endAttribute);
        }
      });
    }).catch(response  => {
    });
  },
  getStyleName(storyLayer) {
    if (storyLayer.get("canStyleWMS")) {
      return fetch(`${storyLayer.get("path")}rest/layers/${storyLayer.get("id")}.json`)
        .then(rawResponse => {
          if (!rawResponse.ok) {
            return null;
          }
          return rawResponse.json().then(response => {
            storyLayer.set(
              "styleName",
              response.layer.defaultStyle.name
            );
          });
        })
        .catch(response =>{});
    }
    return Promise.resolve("");

  },
  getFeatures(storyLayer, map) {
    const name = storyLayer.get("id");
    const cql = storyLayer.get("cql");
    let wfsUrl =
      `${storyLayer.get("url")
      }?service=WFS&version=1.1.0&request=GetFeature&typename=${
        name
      }&outputFormat=application/json` +
      `&srsName=${
        map
          .getView()
          .getProjection()
          .getCode()}`;

    if (cql) {
      wfsUrl += `&cql_filter=${  cql}`;
    }

    wfsUrl += `&t=${  new Date().getTime()}`;

    $rootScope.$broadcast("layer-status", {
      name: storyLayer.get("name"),
      phase: "features",
      status: "loading"
    });

    return fetch(wfsUrl)
      .then(rawResponse => {
        if (!rawResponse.ok) {
          return null;
        }
        rawResponse.json().then((response) => {
          const layer = storyLayer.getLayer();
          const filter = storyLayer.get("filter");
          let features = new ol.format.GeoJSON().readFeatures(response);

          if (filter) {
            features = filter(features);
          }

          storyLayer.set("features", features);

          if (layer.getSource() instanceof ol.source.Cluster) {
            layer
              .getSource()
              .getSource()
              .clear(true);
            layer
              .getSource()
              .getSource()
              .addFeatures(features);
          } else if (layer.getSource() instanceof ol.source.Vector) {
            layer.getSource().clear(true);
            layer.getSource().addFeatures(features);
          }

          $rootScope.$broadcast("layer-status", {
            name: storyLayer.get("name"),
            phase: "features",
            status: "done"
          });
        });
        return true;
      })
      .catch(response => {
      });
  }
});

export default stAnnotateLayer;