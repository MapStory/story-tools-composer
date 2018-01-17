var webpack = require("webpack");
var Path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var serverHost = "https://mapstory.org"; //"https://docker";

module.exports = {
  context: __dirname,
  resolve: {
    modules: ["node_modules", "bower_components"],
    alias: {
      jquery: Path.join(__dirname, "node_modules/jquery/dist/jquery")
    }
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!less-loader"
        })
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ["es2015", "stage-0"]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      }
    ] /*,
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!less-loader"
        })
      }
    ]*/
  },
  entry: {
    app: ["babel-polyfill", "./app/app.js"],
    style: "./style/style.js",
    vendor: ["angular", "angular-bootstrap-colorpicker", "angular-translate"]
  },
  output: {
    path: __dirname + "/build",
    publicPath: "/build",
    filename: "[name].bundle.js"
  },
  devServer: {
    compress: true,
    port: 9090,
    proxy: {
      "/maps/*": {
        target: serverHost + "/maps",
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/maps": ""
        }
      },
      "/api/*": {
        target: serverHost + "/api/",
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/api": ""
        }
      },
      "/geoserver/*": {
        target: serverHost + "/geoserver",
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/geoserver": ""
        }
      }
    }
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.bundle.js"
    }),
    new ExtractTextPlugin("./../build/bundle.css")
  ]
};
