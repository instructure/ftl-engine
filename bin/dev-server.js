const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const config = require('../webpack.config')

const port = process.env.DEV_PORT || 3000
const target = process.env.APP_TARGET || 'http://localhost:3001'
let serverOpts = {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  contentBase: './build-app',
  proxy: {
    '/api': {
      target: target,
      secure: false
    },
    '/activities': {
      target: target,
      secure: false
    }
  }
}
if (process.env.QUIET_WEBPACK) {
  serverOpts = Object.assign(serverOpts, {
    quiet: false,
    noInfo: false,
    stats: {
      // Config for minimal console.log mess.
      assets: false,
      colors: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: false
    }
  })
}
new WebpackDevServer(webpack(config), serverOpts)
.listen(port, 'localhost', function (err, result) {
  if (err) {
    return console.log(err)
  }

  console.log(`Listening at http://localhost:${port}/`)
})
