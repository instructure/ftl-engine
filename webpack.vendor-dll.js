const webpack = require('webpack')
const pkg = require('./package.json')
const path = require('path')
const allDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies))
const vendorDeps = allDeps.filter((d) => {
  return d.startsWith('react') ||
         d.startsWith('redux') ||
         d.startsWith('d3') ||
         d.startsWith('material-ui') ||
         d.startsWith('lodash') ||
         d.startsWith('moment') ||
         d.startsWith('superagent')

})
const NODE_ENV = process.env.NODE_ENV || 'development'
const isDev = NODE_ENV === 'development'

//in prod, we want to write out to the build for the server
const prodOutputPath = path.resolve(__dirname, 'build', 'src', 'server', 'public')
// in dev, write locally, so we can have webpack dev server grab stuff
const devOutputPath = path.resolve(__dirname, 'build-app')
const outputPath = isDev ? devOutputPath : prodOutputPath

module.exports = {
  entry: {
    vendor: vendorDeps
  },

  output: {
    filename: 'js/[name].dll.js',
    path: outputPath,
    library: '[name]',
  },

  plugins: [
    new webpack.DllPlugin({
      path: `${outputPath}/[name]-manifest.json`,
      name: '[name]'
    }),
  ],
}
