const X2JS = require("x2js");

function layerSvc(stateSvc, appConfig, $http, $q, $log) {
  const svc = {};

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

  svc.removeLayer = lyr => {
    stateSvc.removeLayer(lyr.values_.uuid);
    window.storyMap.removeStoryLayer(lyr);
  };

  svc.toggleVisibleLayer = lyr => {
    window.storyMap.toggleStoryLayer(lyr);
  };

  svc.compileLayerNamesFromSearchIndex = searchIndex => {
    const names = [];
    for (let i = 0; i < searchIndex.length; i += 1) {
      if (searchIndex[i].title) {
        names.push(searchIndex[i].title);
      } else {
        names.push(searchIndex[i].typename);
      }
    }
    return names;
  };

  svc.getNameFromIndex = (layerName, nameIndex) => {
    let name;
    for (let i = 0; i < nameIndex.length; i += 1) {
      if (
        nameIndex[i].title.trim() === layerName.trim() ||
        nameIndex[i].typename === layerName
      ) {
        name = nameIndex[i].typename;
      }
    }
    return name;
  };

  svc.handleAddLayerError = problems => {
    $log.warn("Failed to load because of %s", problems);
  };

  svc.parseWorkspaceRoute = featureType => {
    if (featureType) {
      const split = featureType.split(":");
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

  const datata = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:geonode="http://www.geonode.org/" xmlns:gml="http://www.opengis.net/gml" elementFormDefault="qualified" targetNamespace="http://www.geonode.org/">
  <xsd:import namespace="http://www.opengis.net/gml" schemaLocation="https://mapstory.org/geoserver/schemas/gml/3.1.1/base/gml.xsd"/>
  <xsd:complexType name="postoffices_4617ae50Type">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element maxOccurs="1" minOccurs="1" name="ogc_fid" nillable="false" type="xsd:int"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="lat_deg" nillable="true" type="xsd:double"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="long_deg" nillable="true" type="xsd:double"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="postoffice" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="state" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="county" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="date_estab" nillable="true" type="xsd:string"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="date_disco" nillable="true" type="xsd:date"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="zipcode" nillable="true" type="xsd:double"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="wkb_geometry" nillable="true" type="gml:PointPropertyType"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="date_estab_xd" nillable="true" type="xsd:dateTime"/>
          <xsd:element maxOccurs="1" minOccurs="0" name="date_estab_parsed" nillable="true" type="xsd:string"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:element name="postoffices_4617ae50" substitutionGroup="gml:_Feature" type="geonode:postoffices_4617ae50Type"/>
</xsd:schema>`;

  var forEachArrayish = function(arrayish, funct) {
    if (goog.isArray(arrayish)) {
      goog.array.forEach(arrayish, funct);
    } else {
      funct(arrayish);
    }
  };

  svc.getFeatureType = layer => {
    const deferredResponse = $q.defer();

    const url = `${layer.get(
      "path"
    )}wfs?version=1.1.0&request=DescribeFeatureType&typeName=${layer.get(
      "name"
    )}`;

    const then = response => {
      response.data = datata;
      // TODO: Use the OpenLayers parser once it is done
      const x2js = new X2JS();
      const json = x2js.xml2js(response.data);
      const wps = new storytools.edit.WFSDescribeFeatureType.WFSDescribeFeatureType();
      const layerInfo = wps.parseResult(response.data.toString());
      const schema = [];
      let geometryType = null;
      if (goog.isDefAndNotNull(json.schema)) {
        layer.get("metadata").savedSchema = null;
        const savedSchema = layer.get("metadata").savedSchema;
        forEachArrayish(
          json.schema.complexType.complexContent.extension.sequence.element,
          obj => {
            schema[obj._name] = obj;
            schema[obj._name].visible = true;
            if (obj._type.indexOf("gml:") != -1) {
              const lp = obj._type.substring(4);
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
              for (let index = 0; index < savedSchema.length; index += 1) {
                if (obj._name === savedSchema[index].name) {
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
        layer.set("styleName", `geonode_${layer.get("name")}`);
        layer.set("path", "/geoserver/");
      }
      deferredResponse.resolve();
    };

    // add this to get stack trace: then({});

    /*
    $http.get(url).then(
      response => then(response),
      reject => {
        deferredResponse.reject(reject);
      }
    );
    */
    return deferredResponse.promise;
  };

  svc.getLayerConfig = layerName => {
    const result = $q.defer();
    let layerConfig = null;
    const server = appConfig.servers[0];
    const config = {};
    config.headers = {};
    if (goog.isDefAndNotNull(server.authentication)) {
      config.headers["Authorization"] = `Basic ${server.authentication}`;
    } else {
      config.headers["Authorization"] = "";
    }
    let url = server.path;
    const namespace = "geonode";
    const parser = new ol.format.WMSCapabilities();
    url = `${url.substring(0, url.lastIndexOf("/"))}/${namespace}`;
    url += `/${layerName}/wms?request=GetCapabilities`;
    server.populatingLayersConfig = true;
    $http.get(url, config).then((data, status, headers, config) => {
      const response = parser.read(data.data);
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
