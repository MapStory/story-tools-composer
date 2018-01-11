"use strict";

function layerSvc(stateSvc, appConfig, $http, $q) {
  var svc = {};

  svc.baseLayers = [
    {
      title: "World Light",
      type: "MapBox",
      name: "world-light"
    },
    {
      title: "Geography Class",
      type: "MapBox",
      name: "geography-class"
    },
    {
      title: "Natural Earth 2",
      type: "MapBox",
      name: "natural-earth-2"
    },
    {
      title: "Natural Earth",
      type: "MapBox",
      name: "natural-earth-1"
    },
    {
      title: "Humanitarian OpenStreetMap",
      type: "HOT",
      name: "hot"
    },
    {
      title: "OpenStreetMap",
      type: "OSM",
      name: "osm"
    },
    {
      title: "World Topo Map",
      type: "ESRI",
      name: "world-topo-map"
    },
    {
      title: "No background",
      type: "None"
    }
  ];

  svc.removeLayer = function(lyr) {
    stateSvc.removeLayer(lyr.values_.uuid);
    window.storyMap.removeStoryLayer(lyr);
  };

  svc.toggleVisibleLayer = function(lyr) {
    window.storyMap.toggleStoryLayer(lyr);
  };

  svc.compileLayerNamesFromSearchIndex = function(searchIndex) {
    var names = [];
    for (var i = 0; i < searchIndex.length; i += 1) {
      if (searchIndex[i].title) {
        names.push(searchIndex[i].title);
      } else {
        names.push(searchIndex[i].typename);
      }
    }
    return names;
  };

  svc.getNameFromIndex = function(layerName, nameIndex) {
    var name;
    for (var i = 0; i < nameIndex.length; i++) {
      if (
        nameIndex[i].title.trim() === layerName.trim() ||
        nameIndex[i].typename === layerName
      ) {
        name = nameIndex[i].typename;
      }
    }
    return name;
  };

  svc.handleAddLayerError = function(problems) {
    var msg = "Something went wrong:";
    if (problems[0].status == 404) {
      msg = "Cannot find the specified layer: ";
    } else {
      msg += problems[0].data;
    }
    $log.warn("Failed to load %s because of %s", scope.layerName, problems);
  };

  svc.parseWorkspaceRoute = function(featureType) {
    if (featureType) {
      var split = featureType.split(":");
      if (split.length === 1) {
        return {
          typeName: split[0]
        };
      }
      return {
        workspace: split[0],
        typeName: split[1]
      };
    }
    return null;
  };

  svc.getFeatureType = function(layer) {
    console.log("FEATURE TYPE", layer.get("metadata"));
    var featureType = layer.get("metadata").name;
    var workspaceRoute = svc.parseWorkspaceRoute(featureType);
    var deferredResponse = q.defer();

    var url =
      layer.get("metadata").url +
      "/wfs?version=" +
      settings.WFSVersion +
      "&request=DescribeFeatureType&typeName=" +
      workspaceRoute.typeName;
    console.log("URL ---- >", url);

    $http.get(url).then(
      function(response) {
        // TODO: Use the OpenLayers parser once it is done
        var x2js = new X2JS();
        var json = x2js.xml_str2json(response.data);
        var wps = new storytools.edit.WFSDescribeFeatureType
          .WFSDescribeFeatureType();
        var layerInfo = wps.parseResult(response.data);
        var schema = [];
        var geometryType = null;
        if (goog.isDefAndNotNull(json.schema)) {
          var savedSchema = layer.get("metadata").savedSchema;
          forEachArrayish(
            json.schema.complexType.complexContent.extension.sequence.element,
            function(obj) {
              schema[obj._name] = obj;
              schema[obj._name].visible = true;

              if (obj._type.indexOf("gml:") != -1) {
                var lp = obj._type.substring(4);
                if (
                  lp.indexOf("Polygon") !== -1 ||
                  lp.indexOf("MultiSurfacePropertyType") !== -1
                ) {
                  geometryType = "polygon";
                } else if (lp.indexOf("LineString") !== -1) {
                  geometryType = "line";
                } else if (lp.indexOf("Point") !== -1) {
                  geometryType = "point";
                }
              }

              if (goog.isDefAndNotNull(savedSchema)) {
                for (var index = 0; index < savedSchema.length; index++) {
                  if (obj._name == savedSchema[index].name) {
                    schema[obj._name].visible = savedSchema[index].visible;
                  }
                }
              }
              if (goog.isDefAndNotNull(obj.simpleType)) {
                schema[obj._name]._type = "simpleType";
              }
            }
          );

          layer.get("metadata").schema = schema;
          layer.get("metadata").editable = true;
          layer.get("metadata").workspaceURL = json.schema._targetNamespace;
          layer.get("metadata").geomType = geometryType;
          layer.get("metadata").has_style = goog.isDefAndNotNull(geometryType);
          layer.get("metadata").attributes = layerInfo.attributes;
          layer.set("attributes", layerInfo.attributes);
          layer.set("featureNS", layerInfo.featureNS);
          layer.set("typeName", layer.get("metadata").name);
          layer.get("metadata").nativeName = layer.get("metadata").name;
          layer.set("styleName", "geonode_" + layer.get("metadata").name);
          layer.set("path", "/geoserver/");
          console.log("LAYER LAYER", layer);
        }
        deferredResponse.resolve();
      },
      function(reject) {
        deferredResponse.reject(reject);
      }
    );
    return deferredResponse.promise;
  };

  svc.getLayerConfig = function(layerName) {
    var result = $q.defer();
    var layerConfig = null;
    var server = appConfig.servers[0];
    var config = {};
    config.headers = {};
    if (goog.isDefAndNotNull(server.authentication)) {
      config.headers["Authorization"] = "Basic " + server.authentication;
    } else {
      config.headers["Authorization"] = "";
    }
    var url = server.path;
    var namespace = "geonode";
    var parser = new ol.format.WMSCapabilities();
    url = url.substring(0, url.lastIndexOf("/")) + "/" + namespace;
    url += "/" + layerName + "/wms?request=GetCapabilities";
    server.populatingLayersConfig = true;
    $http.get(url, config).then(function(data, status, headers, config) {
      var response = parser.read(data.data);
      if (
        goog.isDefAndNotNull(response.Capability) &&
        goog.isDefAndNotNull(response.Capability.Layer)
      ) {
        layerConfig = response.Capability.Layer;
        result.resolve(layerConfig);
      }
    });

    return result.promise;
  };

  return svc;
}

module.exports = layerSvc;
