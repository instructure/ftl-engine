import * as express from 'express'
import * as path from 'path'
import { SWF } from 'aws-sdk'

import { Config } from '../Config'
import { buildApi } from './api'

export function buildServer(config: Config): express.Express {
  const app: express.Express = express()
  app.use('/', express.static(path.join(__dirname, 'public')))
  app.use('/activities', express.static(path.join(__dirname, '..', 'compileActivities', 'build')))
  const apiRouter = buildApi(config)
  
  app.use('/api', apiRouter)
  return app

}
