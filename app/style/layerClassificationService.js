/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import WPSClassify from "./WPSClassify";

export default function stLayerClassificationService($uibModal, $sce) {
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = (cookies[i]).trim();
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (`${name  }=`)) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  const csrftoken = getCookie("csrftoken");
  return {
    classify: function classify(layer, attribute, method, numClasses) {
      if (!this.cache) {
        this.cache = {};
      }
      if (attribute === null || method === null) {
        return new Error("Not enough info to perform WPS request.");
      }
      const key =
        `${layer.get("id")  }|${  attribute  }|${  method  }|${  numClasses}`;
      if (this.cache[key]) {
        return Promise.resolve(this.cache[key]);
      }
      let xml;
      const service = this;
      const wps = new WPSClassify();
      const url = `${layer.get("path")  }wps`;
      if (method === "unique") {
        xml = wps.getUniqueValues(
          {
            featureNS: layer.get("featureNS"),
            typeName: layer.get("typeName"),
            featurePrefix: layer.get("featurePrefix"),
            attribute
          },
          true
        );
        return fetch(url, {
          method: "POST",
          body: xml,
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/xml",
            "X-CSRFToken": csrftoken,
            "Accept": "application/json"
          }
        }).then(rawResult => rawResult.json().then(result => {
          const results = [];
          if (result && result.features) {
            for (let i = 0, ii = Math.min(result.features.length, numClasses); i < ii; ++i) {
              const feature = result.features[i];
              results.push({
                name: feature.properties.value,
                title: feature.properties.value,
                value: feature.properties.value
              });
            }
          }
          service.cache[key] = results;
          return results;
        }), err => {
        });
      }
      let wpsMethod;
      if (method === "Natural Breaks") {
        wpsMethod = "NATURAL_BREAKS";
      } else if (method === "Equal Interval") {
        wpsMethod = "EQUAL_INTERVAL";
      } else if (method === "Quantile") {
        wpsMethod = "QUANTILE";
      }
      // this should not happen since we only have methods in the UI that we support
      if (wpsMethod !== undefined) {
        xml = wps.classifyVector(
          {
            featureNS: layer.get("featureNS"),
            typeName: layer.get("typeName"),
            featurePrefix: layer.get("featurePrefix"),
            attribute,
            numClasses,
            method: wpsMethod
          },
          true
        );

        return fetch(url, {
          method: "POST",
          body: xml,
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/xml",
            "X-CSRFToken": csrftoken,
          }
        }).then(rawResult => rawResult.text().then(result => {
          const response = wps.parseResult(result);
          if (response.success === true) {
            service.cache[key] = response.rules;
            return response.rules;
          }
          $uibModal.open({
            templateUrl: "/lib/templates/core/error-dialog.html",
            controller($scope) {
              $scope.title = "Error";
              $scope.msg = $sce.trustAsHtml(
                `${"An error occurred when communicating with the classification " +
                "service: <br/>"}${
                  response.msg}`
              );
            }
          });
          return [];

        }), err => {
        });
      }
      // TODO: We should fix how we handle creating rules, right now this just throws
      // an error whenever there's an invalid rule input
      return undefined;
    }
  };
}
