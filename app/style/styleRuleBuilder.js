/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

export default function stStyleRuleBuilder(stStyleTypes, stStyleChoices) {
  function hex(v) {
    return (`00${  v.toString(16)}`).slice(-2);
  }
  function colorRampValues(ramp, num) {
    if (num === 1) {
      return [ramp[0]];
    }
    const colors = [];
    const rampStops = Object.keys(ramp).filter((x) => x.toString().charAt(0) !== "$");
    rampStops.sort();
    const ms = rampStops.map((k) => {
      const val = ramp[k];
      return [parseInt(val.substr(1, 2), 16),
        parseInt(val.substr(3, 2), 16),
        parseInt(val.substr(5, 2), 16)
      ];
    });
    const step = 1.0 / (num - 1);
    function getStops() {
      // @todo find stops
      return [rampStops[0], rampStops[1]];
    }

    // @todo hsv interpolation (yields brighter colors)?
    for (let i = 0; i < num; i++) {
      const val = i * step;
      const stops = getStops(val);
      const r = (val - stops[0]) / (stops[1] - stops[0]);
      const start = ms[stops[0]];
      const stop = ms[stops[1]];
      const red = Math.floor(start[0] + (stop[0] - start[0]) * r);
      const green = Math.floor(start[1] + (stop[1] - start[1]) * r);
      const blue = Math.floor(start[2] + (stop[2] - start[2]) * r);
      colors.push(`#${  hex(red)  }${hex(green)  }${hex(blue)}`);
    }
    return colors;
  }
  function buildRule(rule, context) {
    const type = context.styleType.rule;
    const ruleStyle = {};
    angular.forEach(type, (copyRule, styleProp) => {
      const target = {};
      angular.forEach(copyRule, (copySource, copyDest) => {
        let val = null;
        switch (copySource) {
        case "color":
          if (context.colors) {
            val = context.colors[context.index % context.colors.length];
          }
          break;
        case "range":
          if (context.rangeStep) {
            val = Math.round(context.rangeStep * context.index);
          }
          break;
        default:
          throw new Error(`invalid copySource ${  copySource}`);
        }
        if (val !== null) {
          target[copyDest] = val;
        }
      });
      ruleStyle[styleProp] = target;
    });
    rule.style = ruleStyle;
  }

  return {
    _colorRampValues: colorRampValues,
    buildRuleStyles(style) {
      let colors;
      let rangeStep;
      if (style.classify) {
        if (style.classify.colorRamp) {
          colors = colorRampValues(style.classify.colorRamp, style.rules.length);
        } else if (style.classify.colorPalette) {
          const palette = stStyleChoices.getPalette(style.classify.colorPalette);
          // @todo interpolate if needed?
          colors = palette.vals;
        }
        if (style.classify.range) {
          rangeStep = (style.classify.range.max - style.classify.range.min) / style.rules.length;
        }
      }
      const context = {
        colors,
        rangeStep,
        style,
        styleType: stStyleTypes.getStyleType(style.typeName)
      };
      style.rules.forEach((r, i) => {
        context.index = i;
        buildRule(r, context);
      });
    }
  };
}

