import {Jsonix, mappings} from "./owsjs"

function createSymbolizerObject(graphicOrMark, opacity, styleRule, style){
  return {
    name: {
      localPart: "PointSymbolizer",
      namespaceURI: "http://www.opengis.net/sld"
    },
    value: {
      graphic: {
        externalGraphicOrMark: graphicOrMark,
        opacity: {
          content: [String(opacity)]
        },
        size: {
          content: [String(styleRule && styleRule.style.symbol && styleRule.style.symbol.size ||
            style.symbol && style.symbol.size || 10)]
        },
        rotation: style.symbol && style.symbol.rotationAttribute ? {
          content: [style.symbol.rotationUnits === "degrees" ? {
            name: {
              localPart: "PropertyName",
              namespaceURI: "http://www.opengis.net/ogc"
            },
            value: {
              content: [style.symbol.rotationAttribute]
            }
          } : {
            name: {
              localPart: "Div",
              namespaceURI: "http://www.opengis.net/ogc"
            },
            value: {
              expression: [{
                name: {
                  localPart: "PropertyName",
                  namespaceURI: "http://www.opengis.net/ogc"
                },
                value: {
                  content: [style.symbol.rotationAttribute]
                }
              }, {
                name: {
                  localPart: "Div",
                  namespaceURI: "http://www.opengis.net/ogc"
                },
                value: {
                  expression: [{
                    name: {
                      localPart: "Function",
                      namespaceURI: "http://www.opengis.net/ogc"
                    },
                    value: {
                      name: "pi"
                    }
                  }, {
                    name: {
                      localPart: "Literal",
                      namespaceURI: "http://www.opengis.net/ogc"
                    },
                    value: {
                      content: ["360"]
                    }
                  }]
                }
              }]
            }
          }]
        } : undefined
      }
    }
  };
}

function generateJSONRules(self, rule, style, ruleContainer) {
  for (let i = 0, ii = style.rules.length; i < ii; ++i) {
    const styleRule = style.rules[i];
    let filter;
    if (styleRule.value) {
      filter = {
        comparisonOps: {
          name: {
            namespaceURI: "http://www.opengis.net/ogc",
            localPart: "PropertyIsEqualTo"
          },
          value: {
            expression: [{
              name: {
                namespaceURI: "http://www.opengis.net/ogc",
                localPart: "PropertyName"
              },
              value: {
                content: [style.classify.attribute]
              }
            }, {
              name: {
                namespaceURI: "http://www.opengis.net/ogc",
                localPart: "Literal"
              },
              value: {
                content: [String(styleRule.value)]
              }
            }]
          }
        }
      };
    } else if (styleRule.range) {
      filter = {
        comparisonOps: {
          name: {
            namespaceURI: "http://www.opengis.net/ogc",
            localPart: "PropertyIsBetween"
          },
          value: {
            expression: {
              name: {
                namespaceURI: "http://www.opengis.net/ogc",
                localPart: "PropertyName"
              },
              value: {
                content: [style.classify.attribute]
              }
            },
            lowerBoundary: {
              expression: {
                name: {
                  namespaceURI: "http://www.opengis.net/ogc",
                  localPart: "Literal"
                },
                value: {
                  content: [String(styleRule.range.min)]
                }
              }
            },
            upperBoundary: {
              expression: {
                name: {
                  namespaceURI: "http://www.opengis.net/ogc",
                  localPart: "Literal"
                },
                value: {
                  content: [String(styleRule.range.max)]
                }
              }
            }
          }
        }
      };
    }
    let title = styleRule.title;
    if (title === null || title === undefined || title === "") {
      title = styleRule.name;
    }
    rule = {
      title,
      name: styleRule.name,
      filter,
      symbolizer: []
    };
    if (style.geomType === "point") {
      rule.symbolizer.push(self.createPointSymbolizer(style, styleRule));
    } else if (style.geomType === "line") {
      rule.symbolizer.push(self.createLineSymbolizer(style, styleRule));
    } else if (style.geomType === "polygon") {
      rule.symbolizer.push(self.createPolygonSymbolizer(style, styleRule));
    }
    if (style.label && style.label.attribute !== null) {
      rule.symbolizer.push(self.createTextSymbolizer(style));
    }
    ruleContainer.push(rule);
  }
}


export default function SLDStyleConverter() {
  return {
    generateStyle(style, layerName, asString) {
      const config = this.convertJSON(style, layerName);

      if (!this.context) {
        this.context = new Jsonix.Context([mappings.XLink_1_0, mappings.Filter_1_0_0, mappings.GML_2_1_2, mappings.SLD_1_0_0], {
          namespacePrefixes: {
            "http://www.w3.org/1999/xlink": "xlink",
            "http://www.opengis.net/sld": "sld",
            "http://www.opengis.net/ogc": "ogc"
          }
        });
        this.marshaller = this.context.createMarshaller();
      }
      if (asString === true) {
        return this.marshaller.marshalString(config);
      } 
      return this.marshaller.marshalDocument(config);
      
    },
    createFill(style, styleRule) {
      // If there isn't a rule specific opacity, use the style one
      // if there isn't a style one, default to 1
      let opacity;
      if (styleRule && styleRule.style.symbol.fillOpacity !== undefined) {
        opacity = styleRule.style.symbol.fillOpacity / 100;
      } else {
        opacity = (style.symbol.fillOpacity || 100) / 100;
      }
      return {
        cssParameter: [{
          name: "fill",
          content: [(styleRule && styleRule.style.symbol.fillColor) ? styleRule.style.symbol.fillColor : style.symbol.fillColor]
        }, {
          name: "fill-opacity",
          content: [String(opacity)]
        }]
      };
    },
    createStroke(style, styleRule) {
      let dashArray;
      if (style.stroke.strokeStyle === "dashed") {
        dashArray = "5";
      } else if (style.stroke.strokeStyle ==="dotted") {
        dashArray = "1 2";
      }
      return {
        cssParameter: [{
          name: "stroke",
          content: [(styleRule && styleRule.style.stroke.strokeColor) ? styleRule.style.stroke.strokeColor : style.stroke.strokeColor]
        }, {
          name: "stroke-width",
          content: style.stroke.strokeWidth ? [String(style.stroke.strokeWidth)] : undefined
        }, {
          name: "stroke-opacity",
          content: style.stroke.strokeOpacity ? [String(style.stroke.strokeOpacity / 100)] : undefined
        }, {
          name: "stroke-dasharray",
          content: dashArray ? [dashArray] : undefined
        }]
      };
    },
    createPolygonSymbolizer(style, styleRule) {
      const fill = this.createFill(style, styleRule);
      const stroke = this.createStroke(style);
      const polygon = {
        name: {
          localPart: "PolygonSymbolizer",
          namespaceURI: "http://www.opengis.net/sld"
        },
        value: {
          fill,
          stroke
        }
      };
      return polygon;
    },
    createPointSymbolizer(style, styleRule) {
      const fill = this.createFill(style, styleRule);
      const stroke = this.createStroke(style);
      let graphicOrMark;
      if (style.symbol && style.symbol.graphic) {
        const a = document.createElement("a");
        // @todo appending icon commons attributes should go elsewhere
        if (style.symbol.graphicColorType === "Original Color" && style.symbol.graphicType === null) {
          a.href = style.symbol.graphic;
        } else {
          a.href = `${style.symbol.graphic  }?` +
            `fill=${  encodeURIComponent((styleRule && styleRule.style.symbol.fillColor) ? styleRule.style.symbol.fillColor : style.symbol.fillColor) 
            }&stroke=${  encodeURIComponent(style.stroke.strokeColor)}`;
        }
        graphicOrMark = [{
          TYPE_NAME: "SLD_1_0_0.ExternalGraphic",
          fill,
          stroke,
          format: "image/svg+xml",
          onlineResource: {
            href: a.href
          }
        }];
      } else {
        graphicOrMark = [{
          TYPE_NAME: "SLD_1_0_0.Mark",
          fill,
          stroke,
          wellKnownName: style.symbol && style.symbol.shape || "circle"
        }];
      }
      let opacity = 1;
      if (style.symbol && angular.isDefined(style.symbol.fillOpacity)) {
        opacity = Math.max(0.01, style.symbol.fillOpacity) / 100;
      }
      return createSymbolizerObject(graphicOrMark, opacity, styleRule, style);
    },
    createLineSymbolizer(style, styleRule) {
      return {
        name: {
          localPart: "LineSymbolizer",
          namespaceURI: "http://www.opengis.net/sld"
        },
        value: {
          stroke: this.createStroke(style, styleRule)
        }
      };
    },
    createTextSymbolizer(style) {
      let fontFamily;
      const styleFontFamily = style.label.fontFamily.toLowerCase();
      if (styleFontFamily === "serif") {
        fontFamily  = "Serif";
      } else if (styleFontFamily === "sans-serif") {
        fontFamily = "SansSerif";
      } else if (styleFontFamily === "monospace") {
        fontFamily = "Monospaced";
      }

      const styleObj = {
        name: {
          localPart: "TextSymbolizer",
          namespaceURI: "http://www.opengis.net/sld"
        },
        value: {
          fill: {
            cssParameter: [{
              name: "fill",
              content: [style.label.fillColor]
            }]
          },
          labelPlacement: {
            linePlacement: {}
          },
          font: {
            cssParameter: [{
              name: "font-family",
              content: fontFamily ? [fontFamily]: undefined
            }, {
              name: "font-size",
              content: [String(style.label.fontSize)]
            }, {
              name: "font-style",
              content: [style.label.fontStyle]
            }, {
              name: "font-weight",
              content: [style.label.fontWeight]
            }]
          },
          label: {
            content: [{
              name: {
                localPart: "PropertyName",
                namespaceURI: "http://www.opengis.net/ogc"
              },
              value: {
                content: [style.label.attribute]
              }
            }]
          },
          vendorOption: [{
            name: "maxDisplacement",
            content: "40"
          }, {
            name: "autoWrap",
            content: "40"
          }, {
            name: "spaceAround",
            content: "0"
          }, {
            name: "followLine",
            content: "false"
          }, {
            name: "group",
            content: "yes"
          }, {
            name: "goodnessOfFit",
            content: "0.2"
          }, {
            name: "conflictResolution",
            content: "true"
          }]
        }
      };

      if (style.label.underlineText) {
        styleObj.value.vendorOption.push({
          name: "underlineText",
          content: "true"
        });
      }

      if (style.label.halo) {
        styleObj.value.halo = {
          fill: {
            cssParameter: [{
              name: "fill",
              content: ["#FFFFFF"]
            }]
          },
          radius: {
            content: ["1"]
          }
        };
      }

      return styleObj;
    },
    convertJSON(style, layerName) {
      const result = {
        name: {
          namespaceURI: "http://www.opengis.net/sld",
          localPart: "StyledLayerDescriptor"
        }
      };
      result.value = {
        version: "1.0.0",
        namedLayerOrUserLayer: [{
          TYPE_NAME: "SLD_1_0_0.NamedLayer",
          name: layerName,
          namedStyleOrUserStyle: [{
            TYPE_NAME: "SLD_1_0_0.UserStyle",
            name: style.name,
            featureTypeStyle: [{
              rule: []
            }]
          }]
        }]
      };
      let rule;
      const ruleContainer = result.value.namedLayerOrUserLayer[0].namedStyleOrUserStyle[0].featureTypeStyle[0].rule;
      if (style.rules) {
        generateJSONRules(this, rule, style, ruleContainer);
      } else {
        // single rule, multiple symbolizers
        rule = {
          symbolizer: []
        };
        ruleContainer.push(rule);
        if (style.geomType === "point") {
          rule.symbolizer.push(this.createPointSymbolizer(style));
        } else if (style.geomType === "line") {
          rule.symbolizer.push(this.createLineSymbolizer(style));
        } else if (style.geomType === "polygon") {
          rule.symbolizer.push(this.createPolygonSymbolizer(style));
        }
        if (style.label && style.label.attribute !== null) {
          rule.symbolizer.push(this.createTextSymbolizer(style));
        }
      }
      return result;
    }
  };
};