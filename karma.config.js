var webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    reporters: ['progress'],
    port: 9876,
    colors: false,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    autoWatchBatchDelay: 300,

    files: [
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
      require("karma-chrome-launcher"),
      require("karma-webpack"),
      require("karma-jasmine"),
      require("karma-phantomjs-launcher"),
    ]
  });
};
