var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    context: __dirname,
    resolve: {
        modules: ['node_modules', 'bower_components']
    },
    module: {
        loaders: [
          {
             test: /\.css$/,
             loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
           },
           {
             test: /\.less$/,
             loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!less-loader' })
           }
        ]
    },
    entry: {
        app: './app/app.js',
        style: './style/style.js',
        vendor: ['angular', 'angular-bootstrap-colorpicker']
    },
    output: {
        path: __dirname + '/js',
        filename: '[name].bundle.js'
    },
    devServer: {
      compress: true,
      port: 9090,
      proxy: {
        '/maps/*': {
          target: 'https://mapstory.org/maps',
          changeOrigin: true,
          secure: false,
          pathRewrite: {
            '^/maps': ''
          }
        },
        '/geoserver/*': {
          target: 'https://mapstory.org/geoserver',
          changeOrigin: true,
          secure: false,
          pathRewrite: {
            '^/geoserver': ''
          }
        }
      }
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'vendor.bundle.js' }),
        new ExtractTextPlugin("style/bundle.css")
    ]
};
