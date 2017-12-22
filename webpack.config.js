const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDev = process.env.NODE_ENV === "development";
const cssFilename = isDev ? "[name].css" : "[name].[contenthash].css";
const jsFilename = isDev ? "[name].js" : "[name].[chunkhash].js";

const distPath = __dirname + "/dist";

const extractSass = new ExtractTextPlugin({
   filename: cssFilename,
   disable: isDev
});

module.exports = {
    entry: {
        app: "./src/app.tsx",
        styles: "./src/styles/app.scss",
        vendor: ["react", "react-dom", "query-string"]
    },

    output: {
        filename: jsFilename,
        path: distPath + "/assets"
    },

    devtool: isDev ? "source-map" : "",

    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        rules: [
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

            {
                test: /\.s?css$/,
                use: extractSass.extract({
                    use: [
                        {loader: "css-loader", options: { sourceMap: isDev }},
                        {loader: "sass-loader", options: { sourceMap: isDev }}
                    ],
                    fallback: 'style-loader'
                })
            },
        ]
    },

    plugins: [
        extractSass,
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor",
            filename: jsFilename
        }),
        new HtmlWebpackPlugin({
            filename: '../index.html',
            template: 'src/index.template.html'
        }),
        new CopyWebpackPlugin([
            {from: 'src/public', to: distPath}
        ])
    ]
};