const pkg = require('./package.json')
const path = require('path')
const webpack = require('webpack')
const WebpackCopy = require('copy-webpack-plugin')
const {ForkCheckerPlugin} = require('awesome-typescript-loader')
const devEntries = [
  'react-hot-loader/patch',
  `webpack-dev-server/client?http://localhost:${process.env.DEV_PORT || 3000}`,
  'webpack/hot/only-dev-server'
]
const NODE_ENV = process.env.NODE_ENV || 'development'
const isDev = NODE_ENV === 'development'
// add webpack hot reload if in dev
const otherEntries = isDev ? devEntries : []
const entries = otherEntries.concat(['./app/main.tsx'])

//in prod, we want to write out to the build for the server
const prodOutputPath = path.resolve(__dirname, 'build', 'src', 'server', 'public')
// in dev, write locally, so we can have webpack dev server grab stuff
const devOutputPath = path.resolve(__dirname, 'build-app')
const outputPath = isDev ? devOutputPath : prodOutputPath

const devPlugins = [
  new webpack.NamedModulesPlugin(),
  new webpack.HotModuleReplacementPlugin(),
  new ForkCheckerPlugin(),
]
const prodPlugins = [
  new webpack.optimize.UglifyJsPlugin()
]
const otherPlugins = isDev ? devPlugins : prodPlugins
const allPlugins = otherPlugins.concat([
  new webpack.DllReferencePlugin({
    context: '.',
    manifest: require(`${outputPath}/vendor-manifest.json`)
  }),
  new WebpackCopy([{from: './app/public'}])
])


module.exports = {
  entry: {
    app: entries
  },
  cache: true,
  output: {
    publicPath: '/',
    path: outputPath,
    filename: 'js/index.js'
  },
  // Currently we need to add '.ts' to the resolve.extensions array.
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  plugins: allPlugins,

  devtool: isDev ? 'eval' : 'source-map',

  // Add the loader for .ts files.
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: `awesome-typescript-loader`,
        query: {
          useCache: isDev
        },
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  }
}
