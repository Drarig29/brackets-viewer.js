const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var config = {
    module: {},
};

var bracketsViewerConfig = Object.assign({}, config, {
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'brackets-viewer.min.css',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: require.resolve("path-browserify"),
            util: require.resolve("util/"),
            fs: false
        }
    },
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'brackets-viewer.min.js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['babel-loader', 'ts-loader'],
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
});
var stageFormCreatorConfig = Object.assign({}, config,{
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: require.resolve("path-browserify"),
            util: require.resolve("util/"),
            fs: false
        }
    },
    entry: './src/manager/stageFormCreator.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'stage-form-creator.min.js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['babel-loader', 'ts-loader'],
            },
        ],
    },
});

// Return Array of Configurations
module.exports = [
    bracketsViewerConfig, stageFormCreatorConfig,
];
