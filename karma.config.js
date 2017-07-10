var webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false,
    autoWatchBatchDelay: 300,
    webpack:
     require('./webpack.config.js')[2],
    files: [
      './js/vendor.bundle.js',
      './bower_components/jquery/dist/jquery.min.js',
      './node_modules/time-controls/dist/story-tools-vendor-all.js',
      './bower_components/angular-sortable-view/src/angular-sortable-view.js',
      './node_modules/time-controls/dist/story-tools-core-all.js',
      './node_modules/time-controls/dist/story-tools-edit-tpls.js',
      './node_modules/time-controls/dist/story-tools-edit.js',
      './node_modules/time-controls/dist/story-tools-edit-ng.js',
      './node_modules/time-controls/dist/story-tools-edit-ng.js',
      './node_modules/time-controls/dist/story-tools-mapstory.js',
      './js/app.bundle.js',
      './node_modules/angular-mocks/angular-mocks.js',
      './app/**/*.spec.js'],
    preprocessors: {
      './js/app.bundle.js': ['webpack']
    },
    webpackMiddleware: {
      noInfo: true
    },
    plugins: [
      require("karma-mocha-reporter"),
      require("karma-chrome-launcher"),
      require("karma-webpack"),
      require("karma-jasmine"),
      require("karma-phantomjs-launcher"),
    ]
  });
};
