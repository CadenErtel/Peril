const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");

const PORT = process.env.PORT || 8080;
const DEV_PORT = process.env.DEV_PORT || 8081;

module.exports = {
    target: "web",
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
    mode: 'development',
    entry: "./src/main.js",
    output: {
        path: path.resolve(__dirname, "public"),
        publicPath: "/",
        filename: "bundle.js",
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
    plugins: [
        new HtmlWebpackPlugin({
          template: './public/index.html',
          inject: false
        })
    ],
};