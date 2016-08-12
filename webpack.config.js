var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,

  entry: 'assets/js/index.jsx',

  output: {
    path: path.resolve('./dist/'),
    filename: 'main.js'
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader', 
        query: {
          presets: ['react']
        }
      }
    ]
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  }
}
