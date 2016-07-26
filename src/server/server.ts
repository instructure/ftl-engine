import * as express from 'express'
import * as path from 'path'
const browserify = require('browserify-middleware')
import { Config } from '../Config'
import { SWF } from 'aws-sdk'

export function buildServer(config: Config): express.Express {
  const app: express.Express = express()
  const swfClient = config.swfClient
  app.use(express.static(path.join(__dirname, 'public')))
  app.use('/js/app.js', browserify(path.join(__dirname, '../app/app.js')) as express.Handler)
  config.activities.getModules().map((activity) => {
    app.use(`/js/activities/${activity.name}`, browserify(activity.loadLocation) as express.Handler)
  })
  app.get('/activityNames', (req, res, next) => {
    res.json(config.activities.getModules().map((act) => act.name))
  })
  app.get('/domains', (req, res, next) => {
    let domains: string[] = []
    swfClient.listDomains({registrationStatus: 'REGISTERED'}).eachPage((err, data) => {
      if (err) return next(err)
      if (data) {
        res.json({success: true, data: data})
        return
      }
      domains = domains.concat(data.domainInfos.map((di) => di.name))
    })
  })
  return app

}
