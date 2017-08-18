var webpackConfig = require("./webpack.config.js");

var browserMode = false;

module.exports = function(config) {
  config.set({
    basePath: ".",
    client: {
      captureConsole: browserMode ? true : false
    },
    frameworks: ["jasmine"],
    reporters: ["mocha"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: browserMode ? ["Chrome"] : ["PhantomJS"],
    singleRun: browserMode ? false : true,
    autoWatchBatchDelay: 300,
    webpack: require("./webpack.config.js")[2],
    files: [
      "./build/vendor.bundle.js",
      "./js/test_config.js",
      "./bower_components/jquery/dist/jquery.min.js",
      "./node_modules/time-controls/dist/story-tools-vendor-all.js",
      "./bower_components/angular-sortable-view/src/angular-sortable-view.js",
      "./node_modules/time-controls/dist/story-tools-core-all.js",
      "./node_modules/time-controls/dist/story-tools-edit-tpls.js",
      "./node_modules/time-controls/dist/story-tools-edit.js",
      "./node_modules/time-controls/dist/story-tools-edit-ng.js",
      "./node_modules/time-controls/dist/story-tools-mapstory.js",
      "./build/app.bundle.js",
      "./app/**/*.html",
      "./node_modules/angular-mocks/angular-mocks.js",
      "./app/**/*.spec.js"
    ],
    preprocessors: {
      "./js/app.bundle.js": ["webpack"],
      "./app/**/*.html": ["ng-html2js"]
    },
    webpackMiddleware: {
      noInfo: true
    },
    plugins: [
      "karma-ng-html2js-preprocessor",
      "karma-mocha-reporter",
      "karma-chrome-launcher",
      "karma-webpack",
      "karma-jasmine",
      "karma-phantomjs-launcher"
    ]
  });
};
