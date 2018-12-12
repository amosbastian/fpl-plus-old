const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    background: path.resolve(__dirname, 'src/js/background.js'),
    contentScript: path.resolve(__dirname, 'src/js/contentScript.js'),
    options: path.resolve(__dirname, 'src/js/options.js'),
    features: path.resolve(__dirname, 'src/js/features.js'),
    login: path.resolve(__dirname, 'src/js/login.js'),
    index: path.resolve(__dirname, 'src/js/index.js'),
    team: path.resolve(__dirname, 'src/js/team.js'),
    leagues: path.resolve(__dirname, 'src/js/leagues.js'),
    menu: path.resolve(__dirname, 'src/js/menu.js'),
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
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader',
        options: {
          name: '[name].[ext]',
          limit: 100000,
        },
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
      template: path.resolve(__dirname, 'src/html/options.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/background.html'),
      filename: 'background.html',
      chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/features.html'),
      filename: 'features.html',
      chunks: ['features'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/login.html'),
      filename: 'login.html',
      chunks: ['login'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/index.html'),
      filename: 'index.html',
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/team.html'),
      filename: 'team.html',
      chunks: ['team'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/points.html'),
      filename: 'points.html',
      chunks: ['points'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/html/leagues.html'),
      filename: 'leagues.html',
      chunks: ['leagues'],
    }),
  ],
};
