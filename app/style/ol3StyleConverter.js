/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */
import angular from "angular";

export function ol3MarkRenderer(ol3StyleConverter) {
  return (shapeName, size) => {
    const black = ol3StyleConverter.getColor("#000000");
    const strokeWidth = 3; // hack to fix down-scaling for x and cross
    const opts = {color: black, width: strokeWidth};
    const canvas = angular.element(ol3StyleConverter.generateShape({
      symbol: {shape: shapeName, size: size - strokeWidth}
    },
    new ol.style.Fill(opts),
    new ol.style.Stroke(opts)).getImage());
    return canvas;
  };
}


export function ol3StyleConverter(stSvgIcon) {
  return {
    generateShapeConfig(style, fill, stroke) {
      const shape = style.symbol.shape,
        // final size is actually (2 * (radius + stroke.width)) + 1
        radius = style.symbol.size / 2;
      let newStyle;

      switch (shape) {
      case "circle":
        newStyle = {
          fill,
          stroke,
          radius
        };
        break;
      case "square":
        newStyle = {
          fill,
          stroke,
          points: 4,
          radius,
          angle: Math.PI / 4
        };
        break;
      case "triangle":
        newStyle = {
          fill,
          stroke,
          points: 3,
          radius,
          angle: 0
        };
        break;
      case "star":
        newStyle = {
          fill,
          stroke,
          points: 5,
          radius,
          radius2: 0.5*radius,
          angle: 0
        };
        break;
      case "cross":
        newStyle = {
          fill,
          stroke,
          points: 4,
          radius,
          radius2: 0,
          angle: 0
        };
        break;
      case "x":
        newStyle = {
          fill,
          stroke,
          points: 4,
          radius,
          radius2: 0,
          angle: Math.PI / 4
        };
        break;
      default:
        break;
      }

      return newStyle;
    },
    calculateRotation(style, feature) {
      if (style.symbol && style.symbol.rotationAttribute) {
        if (style.symbol.rotationUnits === "radians") {
          return feature.get(style.symbol.rotationAttribute);
        } 
        return (feature.get(style.symbol.rotationAttribute)/360)*Math.PI;
          
      } 
      return undefined;
        
    },
    generateShape(style, fill, stroke, feature) {
      const config = this.generateShapeConfig(style, fill, stroke);
      if (config && feature) {
        config.rotation = this.calculateRotation(style, feature);
      }
      if (style.symbol.graphic) {
        const info = stSvgIcon.getImage(style.symbol.graphic, fill.getColor(), stroke.getColor(), true);
        return new ol.style.Icon({
          src: info.dataURI,
          rotation: this.calculateRotation(style, feature),
          scale: style.symbol.size / Math.max(info.width, info.height),
          opacity: style.symbol.opacity
        });
      }
      if (style.symbol.shape === "circle") {
        return new ol.style.Circle(config);
      }
      return new ol.style.RegularShape(config);
    },
    getText(style, feature) {
      if (style.label && style.label.attribute) {
        return `${  feature.get(style.label.attribute)}`;
      } 
      return undefined;
        
    },
    generateText(style, stroke, feature) {
      if (style.label && style.label.attribute !== null) {
        return new ol.style.Text({
          fill: new ol.style.Fill({color: style.label.fillColor}),
          stroke,
          font: `${style.label.fontStyle  } ${  style.label.fontWeight  } ${  style.label.fontSize  }px ${  style.label.fontFamily}`,
          text: this.getText(style, feature)
        });
      }
      return undefined;
    },
    getColor(color, opacity) {
      let rgba = ol.color.asArray(color);
      if (opacity !== undefined) {
        rgba = rgba.slice();
        rgba[3] = opacity/100;
      }
      return `rgba(${  rgba.join(",")  })`;
    },
    generateCacheKey(style, feature) {
      const text = this.getText(style, feature);
      const classify = (style.classify && style.classify.attribute) ? feature.get(style.classify.attribute) : undefined;
      const rotation = (style.symbol && style.symbol.rotationAttribute) ? feature.get(style.symbol.rotationAttribute): undefined;
      return `${text  }|${  classify  }|${  rotation}`;
    },
    generateStyleClassify(style, feature, stroke, key) {
      let label, result;
      for (let i=0, ii=style.rules.length; i<ii; ++i) {
        const rule = style.rules[i];
        const attrVal = feature.get(style.classify.attribute);
        let match = false;
        if (rule.value !== undefined) {
          match = attrVal === rule.value;
        } else if (rule.range) {
          match = (attrVal >= rule.range.min && attrVal <= rule.range.max);
        }
        if (match) {
          label = this.generateText(style, stroke, feature);
          if (style.geomType === "point" && rule.style.symbol.fillColor) {
            result = [new ol.style.Style({
              text: label,
              image: this.generateShape(style, new ol.style.Fill({color: rule.style.symbol.fillColor}), stroke, feature)
            })];
          } else if (style.geomType === "line" && rule.style.stroke.strokeColor) {
            result = [new ol.style.Style({
              text: label,
              stroke: new ol.style.Stroke({
                color: rule.style.stroke.strokeColor,
                width: 2
              })
            })];
          } else if (style.geomType === "polygon" && rule.style.symbol.fillColor) {
            result = [new ol.style.Style({
              text: label,
              stroke,
              fill: new ol.style.Fill({
                color: rule.style.symbol.fillColor
              })
            })];
          }
        }
      }
      if (result) {
        if (!this.styleCache_[key]) {
          this.styleCache_[key] = {};
        }
        const key2 = this.generateCacheKey(style, feature);
        this.styleCache_[key][key2] = result;
      }
      return result;
    },
    generateStroke(style){
      if (style.stroke) {
        let lineDash;
        if (style.stroke.strokeStyle === "dashed") {
          lineDash = [5];
        } else if (style.stroke.strokeStyle === "dotted") {
          lineDash = [1,2];
        }
        return new ol.style.Stroke({
          lineDash,
          color: this.getColor(style.stroke.strokeColor, style.stroke.strokeOpacity),
          width: style.stroke.strokeWidth
        });
      }
      return undefined;
    },
    generateOtherFill(style, stroke, feature){
      const fill = new ol.style.Fill({
        color: this.getColor(style.symbol.fillColor, style.symbol.fillOpacity)
      });
      return [
        new ol.style.Style({
          image: this.generateShape(style, fill, stroke, feature),
          fill,
          stroke,
          text: this.generateText(style, stroke, feature)
        })
      ];
    },
    generateStyle(style, feature) {
      let result, key2;
      if (!this.styleCache_) {
        this.styleCache_ = {};
      }
      const key = JSON.stringify(style);
      if (this.styleCache_[key]) {
        if (!this.styleCache_[key].length) {
          key2 = this.generateCacheKey(style, feature);
          if (this.styleCache_[key][key2]) {
            return this.styleCache_[key][key2];
          }
        } else {
          return this.styleCache_[key];
        }
      }
      const stroke = this.generateStroke(style);

      if (style.classify && style.classify.attribute !== null) {
        result = this.generateStyleClassify(style, feature, stroke, key);
      } else {
        result = this.generateOtherFill(style, stroke, feature);
      }
      if (result) {
        const hasText = result[0].getText();
        if (hasText || (style.classify && style.classify.attribute) || (style.symbol && style.symbol.rotationAttribute)) {
          if (!this.styleCache_[key]) {
            this.styleCache_[key] = {};
          }
          key2 = this.generateCacheKey(style, feature);
          this.styleCache_[key][key2] = result;
        } else {
          this.styleCache_[key] = result;
        }
      }
      return result;
    }
  };
}



