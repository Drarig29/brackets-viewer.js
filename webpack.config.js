const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var config = {
    module: {},
};

var bracketsViewerConfig = Object.assign({}, config, {
    entry: './src/index.ts',
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'brackets-viewer.min.css',
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
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
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    "autoprefixer",
                                ]
                            }
                        }
                    },
                    'sass-loader',
                ],
            },
        ],
    },
});

var stageFormCreatorConfig = Object.assign({}, config, {
    entry: './src/form.ts',
    resolve: {
        extensions: ['.ts', '.js'],
    },
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
