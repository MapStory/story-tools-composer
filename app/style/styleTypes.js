/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

const defaultSymbol = {
  size: 10,
  shape: "circle",
  graphic: null,
  graphicType: null,
  fillColor: "#f59620",
  fillOpacity: 70,
  rotationAttribute: null,
  rotationUnits: "degrees",
  graphicColorType: "Original Color"
};

const defaultStroke = {
  strokeColor: "#f59620",
  strokeWidth: 1,
  strokeStyle: "solid",
  strokeOpacity: 100
};

const defaultLabel = {
  attribute: null,
  fillColor: "#f59620",
  fontFamily: "Serif",
  fontSize: 10,
  fontStyle: "normal",
  fontWeight: "normal",
  underlineText: false,
  halo: true,
  placement: "point"
};

const defaultUniqueClass = {
  method: "unique",
  attribute: null,
  maxClasses: 5,
  colorRamp: null
};

const defaultBreaksClass = {
  method: null,
  attribute: null,
  maxClasses: 5,
  colorRamp: null
};

const defaultRangeClass = {
  method: null,
  attribute: null,
  maxClasses: 5,
  range: {
    min: 0,
    max: 16
  }
};

const types = [
  {
    name: "simple point",
    displayName: "Simple",
    prototype: {
      geomType: "point"
    }
  },
  {
    name: "unique point",
    displayName: "Unique",
    prototype: {
      geomType: "point",
      classify: defaultUniqueClass
    },
    rule: {
      symbol : {
        fillColor: "color"
      }
    }
  },
  {
    name: "class point",
    displayName: "Choropleth",
    prototype: {
      geomType: "point",
      classify: defaultBreaksClass
    },
    rule: {
      symbol : {
        fillColor: "color"
      }
    }
  },
  {
    name: "graduated point",
    displayName: "Graduated",
    prototype: {
      geomType: "point",
      classify: defaultRangeClass
    },
    rule: {
      symbol: {
        size: "range"
      }
    }
  },
  {
    name: "heatmap",
    displayName: "HeatMap",
    prototype: {
      geomType: "point",
      radius: 8,
      opacity: 0.8
    }
  },
  {
    name: "simple line",
    displayName: "Simple",
    prototype: {
      geomType: "line"
    }
  },
  {
    name: "unique line",
    displayName: "Unique",
    prototype: {
      geomType: "line",
      classify: defaultUniqueClass
    },
    rule: {
      stroke : {
        strokeColor: "color"
      }
    }
  },
  {
    name: "simple polygon",
    displayName: "Simple",
    prototype: {
      geomType: "polygon"
    }
  },
  {
    name: "unique polygon",
    displayName: "Unique",
    prototype: {
      geomType: "polygon",
      classify: defaultUniqueClass
    },
    rule: {
      symbol : {
        fillColor: "color"
      }
    }
  },
  {
    name: "class polygon",
    displayName: "Choropleth",
    prototype: {
      geomType: "polygon",
      classify: defaultBreaksClass
    },
    rule: {
      symbol : {
        fillColor: "color"
      }
    }
  }
];

export function stStyleTypes() {
  return {
    getTypes(storyLayer) {
      return angular.copy(types).filter((f) => f.prototype.geomType === storyLayer.get("geomType"));
    },
    getStyleType(typeName) {
      const match = types.filter((t) => t.name === typeName);
      if (match.length >  1) {
        throw new Error("duplicate type names!");
      }
      return match.length === 0 ? null : match[0];
    },
    createStyle(styleType) {
      const base = {
        symbol: defaultSymbol,
        stroke: defaultStroke,
        label: defaultLabel,
        typeName: styleType.name
      };
      const style = angular.extend({}, angular.copy(base), styleType.prototype);
      if ("classify" in style) {
        style.rules = [];
      }
      return style;
    }
  };
}

export function injectionRun($injector) {
  if ($injector.has("stStyleDefaults")) {
    const defaults = $injector.get("stStyleDefaults");
    [defaultSymbol, defaultStroke].forEach((s) => {
      Object.keys(s).forEach((k) => {
        if (k in defaults) {
          s[k] = defaults[k];
        }
      });
    });
  }
}
