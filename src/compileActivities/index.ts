import { Config } from '../Config'
import * as path from 'path'

const webpack = require('webpack')

export default function compileActivities(config: Config, cb: {(err?: Error)}) {
  const activities = config.activities.getModules()
    .map((act) => act.getUIComponentPath())
    .filter((p) => typeof p === 'string') as string[]
  activities.push(path.resolve(__dirname, 'activityLoader.js'))

  const webpackConfig = config.webpackConfigBuilder(activities, path.resolve(__dirname, 'build'))
  const compiler = webpack(webpackConfig, cb)
}
