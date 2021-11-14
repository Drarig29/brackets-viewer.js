const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        'stage-form-creator': './src/form.ts',
        'brackets-viewer': './src/index.ts',
    },
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
        filename: '[name].min.js',
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
};
