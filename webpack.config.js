const path = require('path')
const webpack = require('webpack')
const WebpackCopy = require('copy-webpack-plugin')
const devEntries = [
  'react-hot-loader/patch',
  `webpack-dev-server/client?http://localhost:${process.env.DEV_PORT || 3000}`,
  'webpack/hot/only-dev-server'
]
const NODE_ENV = process.env.NODE_ENV || 'development'
const isDev = NODE_ENV === 'development'
// add webpack hot reload if in dev
const otherEntries = isDev ? devEntries : []
const entries = otherEntries.concat(['./app/app.tsx'])

//in prod, we want to write out to the build for the server
const prodOutputPath = path.resolve(__dirname, 'build', 'src', 'server', 'public', 'js')
// in dev, write locally, so we can have webpack dev server grab stuff
const devOutputPath = path.resolve(__dirname, 'app-build')

module.exports = {
  entry: entries,
  output: {
    publicPath: '',
    path: isDev ? devOutputPath : prodOutputPath,
    filename: 'js/app.js'
  },
  // Currently we need to add '.ts' to the resolve.extensions array.
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new WebpackCopy([{from: './app/public'}])
  ],

  devtool: isDev ? 'eval-source-map' : 'source-map',

  // Add the loader for .ts files.
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  }
}
