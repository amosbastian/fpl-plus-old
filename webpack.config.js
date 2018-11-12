const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    background: path.resolve(__dirname, 'src/js/background.js'),
    myTeam: path.resolve(__dirname, 'src/js/myTeam.js'),
    classicLeague: path.resolve(__dirname, 'src/js/classicLeague.js'),
    options: path.resolve(__dirname, 'src/js/options.js'),
    popup: path.resolve(__dirname, 'src/js/popup.js'),
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env', {
                    targets: {
                      node: 'current',
                    },
                  },
                ],
              ],
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: ['html-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(jpg|png)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ChromeExtensionReloader(),
    new CleanWebpackPlugin(['build']),
    new CopyWebpackPlugin([
      { from: 'src/manifest.json', flatten: true },
      { from: 'src/images', to: 'images' },
    ]),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/options.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/background.html'),
      filename: 'background.html',
      chunks: ['background'],
    }),
  ],
};
