const webpack = require("webpack");
const Path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const serverHost = "https://docker";

module.exports = {
  context: __dirname,
  devtool: "inline-source-map",
  resolve: {
    modules: ["node_modules"],
    alias: {
      jquery: Path.join(__dirname, "node_modules/jquery/dist/jquery")
    }
  },
  module: {
    rules: [
      {
        test: /\.spec\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
        query: {
          presets: ["es2015", "stage-0"],
          cacheDirectory: true
        }
      },
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
    ]
  },
  entry: {
    app: ["babel-polyfill", "./app/app.js"],
    style: "./style/style.js",
    vendor: [
      "angular",
      "angular-bootstrap-colorpicker",
      "angular-translate",
      "angular-animate"
    ]
  },
  output: {
    path: `${__dirname}/build`,
    publicPath: "/build",
    filename: "[name].bundle.js"
  },
  devServer: {
    compress: true,
    port: 9090,
    proxy: {
      "/maps/*": {
        target: `${serverHost}/maps`,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/maps": ""
        }
      },
      "/api/*": {
        target: `${serverHost}/api/`,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/api": ""
        }
      },
      "/geoserver/*": {
        target: `${serverHost}/geoserver`,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/geoserver": ""
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "../index.html",
      template: "partials/index.html"
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.bundle.js"
    }),
    new ExtractTextPlugin("./../build/bundle.css")
  ]
};
