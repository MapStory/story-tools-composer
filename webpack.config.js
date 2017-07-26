var webpack = require('webpack');
var Path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    context: __dirname,
    resolve: {
        modules: ['node_modules', 'bower_components'],
        alias: {
          jquery: Path.join(__dirname, 'node_modules/jquery/dist/jquery')
        }
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
        vendor: ['angular', 'angular-bootstrap-colorpicker', 'angular-translate']
    },
    output: {
        path: __dirname + '/js',
        publicPath: '/js',
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
        new ExtractTextPlugin("./../style/bundle.css")
    ]
};
