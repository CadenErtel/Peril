const webpack = require("webpack");
const path = require("path");

module.exports = {
    target: "web",
    mode: 'production',
    entry: ["core-js/stable", "regenerator-runtime/runtime", "./src/main.js"],
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
        filename: "bundle.js",
    },
    cache: {
        type: 'filesystem',
        // Change the cache directory to a project-relative folder
        cacheDirectory: path.resolve(__dirname, '.webpack_cache')
    },
    resolve: {
        extensions: [".js", ".jsx"],
    },
    watchOptions: {
        ignored: ["/node_modules/**", "/server/**"]
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
    optimization: {
        minimize: true,
    },
    plugins: [
        new webpack.DefinePlugin({
          CANVAS_RENDERER: JSON.stringify(true),
          WEBGL_RENDERER: JSON.stringify(true),
        }),
    ],
};