export default function stLoading() {
  return {
    restrict: "C",
    templateUrl: "loading/loading.html",
    scope: {
      spinnerHidden: "="
    },
    link(scope, element, attrs) {
      scope.spinnerWidth = 3;
      scope.spinnerRadius = 28;
      if (goog.isDefAndNotNull(attrs.spinnerWidth)) {
        scope.spinnerWidth = parseInt(attrs.spinnerWidth, 10);
      }
      if (goog.isDefAndNotNull(attrs.spinnerRadius)) {
        scope.spinnerRadius = parseInt(attrs.spinnerRadius, 10);
      }
      const loading = element.find(".loading");
      loading.css("width", `${scope.spinnerRadius  }px`);
      loading.css("height", `${scope.spinnerRadius  }px`);
      loading.css("margin", `-${  scope.spinnerRadius / 2  }px 0 0 -${  scope.spinnerRadius / 2  }px`);

      const loadingSpinner = element.find(".loading-spinner");
      loadingSpinner.css("width", `${scope.spinnerRadius - scope.spinnerWidth  }px`);
      loadingSpinner.css("height", `${scope.spinnerRadius - scope.spinnerWidth  }px`);
      loadingSpinner.css("border", `${scope.spinnerWidth  }px solid`);
      loadingSpinner.css("border-radius", `${scope.spinnerRadius / 2  }px`);

      const mask = element.find(".mask");
      mask.css("width", `${scope.spinnerRadius / 2  }px`);
      mask.css("height", `${scope.spinnerRadius / 2  }px`);

      const spinner = element.find(".spinner");
      spinner.css("width", `${scope.spinnerRadius  }px`);
      spinner.css("height", `${scope.spinnerRadius  }px`);

    }
  };
}