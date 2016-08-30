var CompressionPlugin = require('compression-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

var PROD_ENV = JSON.parse(process.env.PROD_ENV || '0');

DEV = './dist/dev/';
PROD = './dist/prod/';

module.exports = {
  context: __dirname,

  entry: 'assets/js/index.js',

  output: {
    path: PROD_ENV ? path.resolve(PROD) : path.resolve(DEV),
    filename: 'main.js'
  },

  plugins: PROD_ENV ? [
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false }
    }),
    //new webpack.optimize.UglifyJsPlugin({minimize: true}),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jquery': 'jquery'
    }),
    new CompressionPlugin({
      asset: "[path]",
      algorithm: 'gzip',
      test: /\.js$|\.css$|\.png$|\.jpg$/,
      threshold: 10240,
      minRatio: .8
    })
  ] : [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jquery': 'jquery'
    })
  ],

  debug: true,
  devtool: 'source-map', 

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader', 
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        loader: ['style', 'css']
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loader: ['style', 'css', 'sass']
      },
      {
        test: /\.jpg$|\.png$/, 
        exclude: /node_modules/,
        loader: 'file-loader?name=img/[name].[ext]'
      },
      {
        test: /\.otf$/, 
        exclude: /node_modules/,
        loader: 'file-loader?name=fonts/[name].[ext]'
      }
    ]
  },

  resolve: {
    root: __dirname,
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  }
}

