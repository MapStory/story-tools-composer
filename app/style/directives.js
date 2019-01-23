export function attributeCombo($log) {
  return {
    restrict: "E",
    templateUrl: "./app/style/templates/widgets/attribute-combo.html",
    scope: {
      layer: "=",
      model: "=stModel",
      onChange: "=?",
      css: "@css"
    },
    link(scope, element, attrs) {
      function readAttributes() {
        const atts = [];
        if (scope.layer) {
          scope.layer.get("attributes").forEach((a) => {
            let include = true;
            if (attrs.filter === "nogeom") {
              include = a.typeNS !== "http://www.opengis.net/gml";
            } else if (attrs.filter === "number") {
              include =
                  a.type === "integer" ||
                  a.type === "int" ||
                  a.type === "double" ||
                  a.type === "long";
            } else if (attrs.filter === "unique") {
              include =
                  /*
                @TODO: enable unique styling of integers after JSONIX-related
                type error is resolved
                  a.type === "integer" ||
                  a.type === "int" ||
                */
                  a.type === "string" || a.type === "long";
            } else if (attrs.filter) {
              $log.warn("unknown filter", attrs.filter);
            }
            if (attrs.include) {
              include = attrs.include.indexOf(a.type) >= 0;
            }
            if (include) {
              atts.push(a.name);
            }
          });
          atts.sort();
          scope.attributes = atts;
        } else {
          scope.attributes = [];
        }
      }
      // @todo is watch actually needed here (possibly the case if reusing the editor)
      scope.$watch("layer", (neu, old) => {
        if (neu != old) {
          readAttributes();
        }
      });
      readAttributes();
      // default property to modify
      scope.property = attrs.property || "attribute";
      // if not provided, the default behavior is to change the model
      if (!scope.onChange) {
        scope.onChange = function(property, val) {
          scope.model[property] = val;
        };
      }
    }
  };
}

export function styleEditor() {
  return {
    restrict: "E",
    templateUrl: "./app/style/templates/style-editor.html",
    controller: "styleEditorController",
    require: "?styleEditorController",
    scope: {
      layer: "=",
      onChange: "=",
      formChanged: "="
    }
  };
}

// @todo break into pieces or make simpler
// @todo doesn't watch iconCommons.defaults() - can become out of date
export function graphicEditor( stStyleChoices, ol3MarkRenderer, iconCommons, iconCommonsSearch,
  $uibModal, stSvgIcon) {
  return {
    restrict: "E",
    templateUrl: "./app/style/templates/widgets/graphic-editor.html",
    scope: {
      layer: "=",
      symbol: "=",
      model: "=stModel"
    },

    link(scope, element, attrs) {
      function canvas(symbol) {
        const el = angular.element(ol3MarkRenderer(symbol, 24));
        el.addClass("symbol-icon");
        el.attr("mark", symbol); // for testing until we use data URI
        return el;
      }
      function image(icon) {
        const el = angular.element("<img>");
        el.attr("src", icon.dataURI);
        el.addClass("symbol-icon");
        el.attr("graphic", icon.uri);
        return el;
      }
      // update the element with the data-current-symbol attribute
      // to match the current symbol
      function current() {
        const el = angular.element(
          element[0].querySelector("[data-current-symbol]")
        );
        el.find("*").remove();
        if (scope.symbol.shape) {
          el.append(canvas(scope.symbol.shape));
        } else if (scope.symbol.graphic) {
          if (scope.symbol.graphicColorType === "Original Color") {
            el.append(`<img class="symbol-icon" src="${  scope.symbol.graphic  }"/>`);
          } else {
            stSvgIcon
              .getImage(scope.symbol.graphic, "#000", "#fff")
              .then((icon) => {
                el.append(image(icon));
              });
          }
        }
      }
      scope.$watch("model.graphicColorType", () => {
        current();
      });
      const clicked = function() {
        const el = angular.element(this);
        if (el.attr("shape")) {
          scope.symbol.shape = el.attr("shape");
          scope.symbol.graphic = null;
          scope.$apply(() => {
            scope.model.shape = scope.symbol.shape;
          });
        } else if (el.attr("graphic")) {
          scope.symbol.shape = null;
          scope.$apply(() => {
            scope.symbol.graphic = el.attr("graphic");
          });
        }
        current();
      };
        // this might be done another way but because we get canvas elements
        // back from ol3 styles, we build the dom manually
      let list = angular.element(
        element[0].getElementsByClassName("ol-marks")
      );
      stStyleChoices.symbolizers.forEach((s) => {
        const img = canvas(s);
        img.attr("shape", s);
        img.on("click", clicked);
        list.append(img);
      });
      function updateRecent() {
        list = angular.element(
          element[0].getElementsByClassName("recent-icons")
        );
        list.html("");
        iconCommons.defaults().then((icons) => {
          icons.forEach((icon, i) => {
            const img = image(icon);
            img.on("click", clicked);
            list.append(img);
          });
          // we're relying on this in the tests as a means of
          // knowing when the recent icons loading has completed
          scope.recent = icons;
        });
      }
      // only in scope for triggering in tests
      scope._updateRecent = function() {
        updateRecent();
        current();
      };
      scope._updateRecent();
      scope.showIconCommons = function() {
        iconCommonsSearch.search().then((selected) => {
          // since ol3 style creation is sync, preload icon before setting
          stSvgIcon.getImageData(selected.href).then(() => {
            scope.symbol.shape = null;
            scope.symbol.graphic = selected.href;
            scope._updateRecent();
          });
        });
      };
    }
  };
}

export function classifyEditor() {
  return {
    restrict: "E",
    templateUrl: "./app/style/templates/widgets/classify-editor.html",
    scope: true,
    link(scope, element, attrs) {
      [
        "showMethod",
        "showMaxClasses",
        "showRange",
        "showColorRamp",
        "showColorPalette",
        "attributeFilter"
      ].forEach((opt) => {
        // Attributes are treated as strings, converts them to boolean
        scope[opt] = attrs[opt] === "true";
      });
    }
  };
}

export function colorRamp() {
  return {
    restrict: "A",
    scope: {
      ramp: "=ramp"
    },
    link(scope, element, attrs) {
      function render() {
        const ctx = element[0].getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, attrs.width, 0);
        Object.getOwnPropertyNames(scope.ramp).forEach((stop) => {
          stop = parseFloat(stop);
          if (!isNaN(stop)) {
            gradient.addColorStop(stop, scope.ramp[stop]);
          }
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, attrs.width, attrs.height);
      }
      scope.$watch("ramp", render);
      render();
    }
  };
}

export function colorField() {
  const regex = /(^#[0-9a-f]{6}$)|(^#[0-9a-f]{3}$)/i;
  function validColor(value) {
    // @todo support named colors?
    return regex.exec(value);
  }
  return {
    restrict: "A",
    require: "ngModel",
    link(scope, element, attrs, ctrl) {
      ctrl.$parsers.push((viewValue) => {
        ctrl.$setValidity("color", validColor(viewValue));
        return viewValue;
      });
      ctrl.$formatters.push((modelValue) => {
        // when loaded but also possible the picker widget modifies
        ctrl.$setValidity("color", validColor(modelValue));
        return modelValue;
      });
    }
  };
}

export function noClose() {
  return {
    link($scope, $element) {
      $element.on("click", ($event) => {
        $event.stopPropagation();
      });
    }
  };
}

const typeURLS = {
  "class-point": require("raw-loader!./templates/types/class-point.html"),
  "class-polygon": require("raw-loader!./templates/types/class-polygon.html"),
  "graduated-point": require("raw-loader!./templates/types/graduated-point.html"),
  "heatmap": require("raw-loader!./templates/types/heatmap.html"),
  "simple-line": require("raw-loader!./templates/types/simple-line.html"),
  "simple-point": require("raw-loader!./templates/types/simple-point.html"),
  "simple-polygon": require("raw-loader!./templates/types/simple-polygon.html"),
  "unique-line": require("raw-loader!./templates/types/unique-line.html"),
  "unique-point": require("raw-loader!./templates/types/unique-point.html"),
  "unique-polygon": require("raw-loader!./templates/types/unique-polygon.html"),
};

export function styleTypeEditor($compile, $templateCache) {
  return {
    restrict: "E",
    link(scope, element, attrs) {
      console.log("styletype");
      scope.$watch("currentEditor", () => {
        const currentEditor = scope.currentEditor;
        if (scope.currentEditor) {
          // const templateUrl =
          //     `./app/style/templates/types/${  currentEditor.name.replace(" ", "-")  }.html`;
          // element.html($templateCache.get(templateUrl));
          const templateUrl = currentEditor.name.replace(" ", "-");
          element.html(typeURLS[templateUrl]);
          $compile(element.contents())(scope);
        } else {
          element.html("");
        }
      });
    }
  };
}

export function rulesEditor() {
  return {
    restrict: "E",
    templateUrl: "./app/style/templates/rules-editor.html",
    link(scope, element, attrs) {
      scope.deleteRule = function(rule) {
        scope.activeStyle.rules = scope.activeStyle.rules.filter((r) => r !== rule);
      };
    }
  };
}


function editorDirective(module, name, templateUrl, property, linker) {
  module.directive(name, [
    "stStyleChoices",
    function(styleChoices) {
      return {
        restrict: "E",
        scope: {
          stModel: "=",
          property: "@",
          popover: "@popoverText"
        },
        templateUrl: `./app/style/templates/widgets/${  templateUrl}`,
        link(scope, element, attrs) {
          // @todo bleck - grabbing the layer from the parent
          // should be replaced with something more explicit
          scope.layer = scope.$parent.layer;
          scope.$watch(
            () => scope.$parent.layer,
            (neu) => {
              scope.layer = neu;
            }
          );
          // endbleck
          scope.model = scope.stModel[property || scope.property];
          scope.styleChoices = styleChoices;
          if (linker) {
            linker(scope, element, attrs);
          }
        }
      };
    }
  ]);
}

// This is an odd way to do it, but no point in redoing it the right way if we're just
// going to convert this to react
export function loadOtherDirectives(module) {

  editorDirective(module, "symbolEditor", "symbol-editor.html", "symbol", (
    scope,
    el,
    attrs
  ) => {
    ["showGraphic", "showRotation", "hideColor", "hideSize"].forEach((opt) => {
      scope[opt] = attrs[opt];
    });
    scope.getSymbolizerText = function(model) {
      return model.shape || model.graphic;
    };
    scope.getSymbolizerImage = function(name) {
      return "";
    };
  });
  editorDirective(module,"strokeEditor", "stroke-editor.html", "stroke");
  editorDirective(module,"numberEditor", "number-editor.html", null, (
    scope,
    el,
    attrs
  ) => {
    const defaults = {
      max: 30,
      min: 0,
      step: 1
    };
    Object.keys(defaults).forEach((e) => {
      scope[e] = attrs[e] || defaults[e];
    });
    function wheel(ev) {
      const input = el.find("input");
      const min = Number(input.attr("min")) || 0;
      const max = Number(input.attr("max"));
      const step = Number(input.attr("step")) || 1;
      let val = scope.stModel[scope.property];
      const scroll = ev.detail || ev.wheelDelta;
      val = Math.min(max, val + (scroll > 0 ? -step : step));
      val = Math.max(min, val);
      scope.$apply(() => {
        scope.stModel[scope.property] = val;
      });
    }
    el[0].addEventListener("DOMMouseScroll", wheel, false); // For FF and Opera
    el[0].addEventListener("mousewheel", wheel, false); // For others
  });
  editorDirective(module,"colorEditor", "color-editor.html");
  editorDirective(module,"labelEditor", "label-editor.html", "label", (scope) => {
    scope.styleModel = {
      bold: scope.model.fontWeight === "bold",
      italic: scope.model.fontStyle === "italic",
      underline: scope.model.underlineText,
      halo: scope.model.halo
    };
    scope.styleModelChange = function() {
      scope.model.fontWeight = scope.styleModel.bold ? "bold" : "normal";
      scope.model.fontStyle = scope.styleModel.italic ? "italic" : "normal";
      scope.model.underlineText = scope.styleModel.underline;
      scope.model.halo = scope.styleModel.halo;
    };
    scope.$watch("styleModel.bold", scope.styleModelChange);
    scope.$watch("styleModel.italic", scope.styleModelChange);
    scope.$watch("styleModel.underline", scope.styleModelChange);
    scope.$watch("styleModel.halo", scope.styleModelChange);
  });

}


