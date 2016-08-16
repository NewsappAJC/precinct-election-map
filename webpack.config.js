var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,

  entry: 'assets/js/index.jsx',

  output: {
    path: path.resolve('./dist/'),
    filename: 'main.js'
  },

  plugins: [
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
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader', 
        query: {
          presets: ['es2015', 'react']
        }
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
        test: /\.jpg$/, 
        exclude: /node_modules/,
        loader: 'file-loader?name=img/[name].[ext]'
      }
    ]
  },

  resolve: {
    root: __dirname,
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  }
}

