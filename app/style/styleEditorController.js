/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

export default function styleEditorController($scope, stStyleTypes, stStyleChoices, stLayerClassificationService, stStyleRuleBuilder) {
  const styles = {};

  function classify() {
    const activeStyle = $scope.activeStyle;
    stLayerClassificationService.classify(
      $scope.layer,
      activeStyle.classify.attribute,
      activeStyle.classify.method,
      activeStyle.classify.maxClasses).then((results) => {
      activeStyle.rules = results;
      stStyleRuleBuilder.buildRuleStyles(activeStyle);
    }).then(() => {
      $scope.$apply();
    });
  }

  function getStyle(styleTyle) {
    let style;

    if (styleTyle.name in styles) {
      style = styles[styleTyle.name];
    } else {
      const styleType = $scope.styleTypes.filter((t) => t.name === styleTyle.name);
      if (styleType.length === 0) {
        throw new Error(`invalid style type: ${  styleTyle.name}`);
      }
      style = stStyleTypes.createStyle(styleType[0]);
    }
    return style;
  }

  function setActiveStyle(styleType) {
    $scope.currentEditor = styleType;
    $scope.activeStyle = getStyle(styleType);
  }

  function setLayer(layer) {
    let style;
    $scope.layer = layer;
    $scope.styleTypes = stStyleTypes.getTypes(layer);

    // If the layer has a style already, use that,
    // otherwise default to the first style type available
    if (layer.get("style")) {
      style = $scope.styleTypes.find(item => item.name === layer.get("style").typeName);
    }
    if (!style && $scope.styleTypes.length > 0) {
      [style] = $scope.styleTypes;
    }
    if (style) {
      setActiveStyle(style);
    }
  }


  $scope.styleChoices = stStyleChoices;
  setLayer($scope.layer);

  $scope.setActiveStyle = setActiveStyle;

  $scope.$watch(() => {
    const active = $scope.styleTypes.filter((e) => e.active);
    return active[0];
  }, (currentSlide, previousSlide) => {
    if (currentSlide && (currentSlide !== previousSlide)) {
      setActiveStyle(currentSlide);
    }
  });

  $scope.$watch("layer",(neu, old) => {
    if (neu !== old) {
      setLayer(neu);
    }
  });

  $scope.changeClassifyProperty = (prop, value) => {
    if (prop) {
      $scope.activeStyle.classify[prop] = value;
    }
    classify();
  };

  $scope.$watch("activeStyle", () => {
    if ($scope.editorForm.$valid) {
      const style = $scope.layer.get("style");
      if (style && style.readOnly === true) {
        delete style.readOnly;
        $scope.activeStyle = style;
      } else {
        $scope.layer.set("style", $scope.activeStyle);
      }
      ($scope.onChange || angular.noop)($scope.layer);
    }
  }, true);

  $scope.$watch("editorForm.$valid", () => {
    ($scope.formChanged || angular.noop)($scope.editorForm);
  });
}

