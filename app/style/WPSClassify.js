/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */
import {Jsonix, mappings} from "../utils/owsjs"

export default function WPSClassify() {

  this.parseResult = function parseResult(xml) {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const exceptions = doc.getElementsByTagNameNS("http://www.opengis.net/ows/1.1", "ExceptionText");
    if (exceptions.length ===0) {
      const classes = doc.getElementsByTagName("Class");
      const rules = [];
      for (let i=0, ii=classes.length; i<ii; ++i) {
        const min = classes[i].getAttribute("lowerBound");
        const max = classes[i].getAttribute("upperBound");
        rules.push({
          name: `${min  }-${  max}`,
          range: {
            min,
            max
          }
        });
      }
      return {
        success: true,
        rules
      };
    } 
    return {
      success: false,
      msg: exceptions[0].textContent
    };
        
  };

  this.createContext = function createContext() {
    this.context = new Jsonix.Context([
      mappings.XLink_1_0,
      mappings.OWS_1_1_0,
      mappings.Filter_1_1_0,
      mappings.OWS_1_0_0,
      mappings.SMIL_2_0,
      mappings.SMIL_2_0_Language,
      mappings.GML_3_1_1,
      mappings.WFS_1_1_0,
      mappings.WPS_1_0_0
    ], {
      namespacePrefixes: {
        "http://www.w3.org/1999/xlink": "xlink",
        "http://www.opengis.net/wps/1.0.0": "wps",
        "http://www.opengis.net/ows/1.1": "ows",
        "http://www.opengis.net/wfs": "wfs"
      }
    });
    this.marshaller = this.context.createMarshaller();
  };

  this.getUniqueValues = function getUniqueValues(data, asString) {
    if (!this.context) {
      this.createContext();
    }
    const config = this.generateMainConfig("gs:Unique", "application/json", data);
    config.value.dataInputs.input.push({
      identifier: {
        value: "attribute"
      },
      data: {
        literalData: {
          value: data.attribute
        }
      }
    });
    if (asString === true) {
      return this.marshaller.marshalString(config);
    } 
    return this.marshaller.marshalDocument(config);
        
  };

  this.generateMainConfig = function generateMainConfig(processId, mimeType, data) {
    const rawDataOutputVal = processId.toLowerCase().indexOf("unique") > -1 ?
      "result" : "results";
    return {
      name: {
        localPart: "Execute",
        namespaceURI: "http://www.opengis.net/wps/1.0.0"
      },
      value: {
        service: "WPS",
        version: "1.0.0",
        identifier: {
          value: processId
        },
        responseForm: {
          rawDataOutput: {
            identifier: {
              value: rawDataOutputVal
            },
            mimeType
          }
        },
        dataInputs: {
          input: [{
            identifier: {
              value: "features"
            },
            reference: {
              method: "POST",
              mimeType: "text/xml",
              href: "http://geoserver/wfs",
              body: {
                content: [{
                  name: {
                    namespaceURI: "http://www.opengis.net/wfs",
                    localPart: "GetFeature"
                  },
                  value: {
                    outputFormat: "GML2",
                    service: "WFS",
                    version: "1.1.0",
                    query: [{
                      typeName: [{ns: data.featureNS, lp: data.typeName.split(":")[1] || data.typeName, p: data.featurePrefix}]
                    }]
                  }
                }]
              }
            }
          }
          ]
        }
      }
    };
  };

  this.classifyVector = function classifyVector(data, asString) {
    if (!this.context) {
      this.createContext();
    }
    const config = this.generateMainConfig("vec:FeatureClassStats", undefined, data);
    config.value.dataInputs.input.push({
      identifier: {
        value: "attribute"
      },
      data: {
        literalData: {
          value: data.attribute
        }
      }
    }, {
      identifier: {
        value: "classes"
      },
      data: {
        literalData: {
          value: String(data.numClasses)
        }
      }
    }, {
      identifier: {
        value: "method"
      },
      data: {
        literalData: {
          value: data.method
        }
      }
    }, {
      identifier: {
        value: "stats"
      },
      data: {
        literalData: {
          value: "mean" /* TODO currently we need to send at least 1 stats input */
        }
      }
    });
    if (asString === true) {
      return this.marshaller.marshalString(config);
    } 
    return this.marshaller.marshalDocument(config);
        
  };
};
