"use strict";

const angular = require("angular");
const ngAnimate = require("angular-animate");

const module = angular.module("composer", [
  ngAnimate,
  "ui.bootstrap",
  "storytools.core.time",
  "storytools.core.mapstory",
  "storytools.core.loading",
  "storytools.core.legend",
  "storytools.edit.style",
  "storytools.edit.boxes",
  "storytools.edit.pins",
  "storytools.core.ogc",
  "colorpicker.module",
  "pascalprecht.translate",
  "angular-sortable-view"
]);

module.constant("appConfig", {
  dimensions: {
    mapWidthEditMode: "70%",
    mapWidthPreviewMode: "100%"
  },
  routes: {
    chapter: "/chapter/"
  },
  servers: [
    {
      name: "mapstory",
      path: "/geoserver/",
      absolutePath: "", //'https://mapstory.org/geoserver/',
      host: "", //'https://mapstory.org/',
      canStyleWMS: false,
      timeEndpoint: function(name) {
        return `/maps/time_info.json?layer=${name}`;
      }
    },
    {
      name: "storyscapes",
      path: "/gsstoryscapes/",
      canStyleWMS: true,
      host: "http://storyscapes.geointservices.io/"
    },
    {
      name: "local",
      path: "/gslocal/",
      canStyleWMS: true
    }
  ],
  iconCommonsHost: "http://mapstory.dev.boundlessgeo.com"
});

module.run(() => {
  // install a watchers debug loop
  ((() => {
    const root = angular.element(document.getElementsByTagName("body"));
    let last;
    let watchers = 0;

    const f = element => {
      if (element.data().hasOwnProperty("$scope")) {
        watchers += (element.data().$scope.$$watchers || []).length;
      }

      angular.forEach(element.children(), childElement => {
        f(angular.element(childElement));
      });
    };

    window.setInterval(() => {
      watchers = 0;
      f(root);
      if (watchers != last) {
        //console.log(watchers);
      }
      last = watchers;
    }, 1000);
  }))();
});

module.config([
  "$qProvider",
  "$translateProvider",
  "$httpProvider",
  "$sceDelegateProvider",
  ($qProvider, $translateProvider, $httpProvider, $sceDelegateProvider) => {
    $qProvider.errorOnUnhandledRejections(false);
    $translateProvider.preferredLanguage("en");
    $httpProvider.defaults.headers.post["X-Requested-With"] = "XMLHttpRequest";

    $httpProvider.defaults.xsrfCookieName = "csrftoken";
    $httpProvider.defaults.xsrfHeaderName = "X-CSRFToken";
    $sceDelegateProvider.resourceUrlWhitelist([
      // Allow same origin resource loads.
      "self",
      // Allow loading from our assets domain.  Notice the difference between * and **.
      "http://mapstory-static.s3.amazonaws.com/**",
      "https://mapstory-static.s3.amazonaws.com/**",
      "http://mapstory-demo-static.s3.amazonaws.com/**",
      "https://mapstory-demo-static.s3.amazonaws.com/**"
    ]);
  }
]);

// function getServer(name) {
//     var server = null;
//     for (var i = 0; i < servers.length; i++) {
//         if (servers[i].name === name) {
//             server = servers[i];
//             break;
//         }
//     }
//     if (server === null) {
//         throw new Error('no server named : ' + name);
//     }
//     return server;
// }

require("./map");
require("./style");
require("./layers");
require("./ui");
require("./time");
require("./search");
require("./state");
require("./pins");
require("./utils");
