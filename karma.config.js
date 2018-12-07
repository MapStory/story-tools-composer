const webpackConfig = require("./webpack.config.js");

const browserMode = false;

module.exports = config => {
  config.set({
    basePath: ".",
    client: {
      captureConsole: !!browserMode
    },
    frameworks: ["jasmine"],
    reporters: ["mocha"],
    port: 9876,
    colors: true,
    logLevel: browserMode ? config.LOG_DEBUG : config.LOG_DISABLE,
    autoWatch: false,
    browsers: browserMode ? ["Chrome"] : ["PhantomJS"],
    singleRun: !browserMode,
    autoWatchBatchDelay: 300,
    webpack: webpackConfig,
    files: [
      "./build/vendor.bundle.js",
      "./js/test_config.js",
      "./node_modules/jquery/dist/jquery.min.js",
      "./node_modules/story-tools/dist/story-tools-vendor-all.js",
      "./node_modules/angular-sortable-view/src/angular-sortable-view.js",
      "./node_modules/story-tools/dist/story-tools-core-all.js",
      "./node_modules/story-tools/dist/story-tools-edit-tpls.js",
      "./node_modules/story-tools/dist/story-tools-edit.js",
      "./node_modules/story-tools/dist/story-tools-edit-ng.js",
      "./node_modules/story-tools/dist/story-tools-mapstory.js",
      "./partials/standaloneConfig.js",
      "./build/app.bundle.js",
      "./app/**/*.html",
      "./node_modules/angular-mocks/angular-mocks.js",
      "./app/**/*.spec.js"
    ],
    preprocessors: {
      "./app/**/*.spec.js": ["babel"],
      "./js/app.bundle.js": ["webpack"],
      "./app/**/*.html": ["ng-html2js"]
    },
    babelPreprocessor: {
      options: {
        presets: ["es2015"]
      }
    },
    webpackMiddleware: {
      noInfo: true
    },
    plugins: [
      "karma-babel-preprocessor",
      "karma-ng-html2js-preprocessor",
      "karma-mocha-reporter",
      "karma-chrome-launcher",
      "karma-webpack",
      "karma-jasmine",
      "karma-phantomjs-launcher"
    ]
  });
};
