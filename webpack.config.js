const isDev = process.env.NODE_ENV === "development";
const PORT = process.env.PORT || 8080;
const DEV_PORT = process.env.DEV_PORT || 8081;

const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: isDev ? "development" : "production",
  target: "web",
  entry: ["core-js/stable", "regenerator-runtime/runtime", "./src/main.js"],
  output: {
    path: path.resolve(__dirname, "public"),
    publicPath: "/",
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devtool: "source-map",
  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"),
    },
    client: {
      progress: true,
      overlay: {
        errors: true,
        warnings: false,
      }
    },
    compress: true,
    port: PORT,
    proxy: {
      '/socket.io': {
          target: `http://localhost:${DEV_PORT}`,
          ws: true,
      },
  }
  },
  watchOptions: {
    ignored: /node_modules/,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: false
    }),
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true),
    }),
  ],
};
