const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const config = require('../webpack.config')

const port = process.env.DEV_PORT || 3000
const target = process.env.APP_TARGET || 'http://localhost:3001'
new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
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
}).listen(port, 'localhost', function (err, result) {
  if (err) {
    return console.log(err)
  }

  console.log(`Listening at http://localhost:${port}/`)
})
