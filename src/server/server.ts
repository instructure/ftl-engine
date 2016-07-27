import * as express from 'express'
import * as path from 'path'
const browserify = require('browserify-middleware')
import { Config } from '../Config'
import { SWF } from 'aws-sdk'
import { processEvents } from 'simple-swf/build/src/tasks/processEvents'

export function buildServer(config: Config): express.Express {
  const app: express.Express = express()
  const swfClient = config.swfClient
  app.use(express.static(path.join(__dirname, 'public')))
  app.use('/js/app.js', browserify(path.join(__dirname, '../app/app.js')) as express.Handler)
  config.activities.getModules().map((activity) => {
    app.use(`/js/activities/${activity.name}`, browserify(activity.loadLocation) as express.Handler)
  })
  app.get('/activityNames', (req, res, next) => {
    res.json({success: true, data: config.activities.getModules().map((act) => act.name)})
  })
  app.get('/domains', (req, res, next) => {
    let domains: string[] = []
    swfClient.listDomains({registrationStatus: 'REGISTERED'}).eachPage((err, data) => {
      if (err) return next(err)
      console.log(data)
      if (!data) {
        res.json({success: true, data: domains}) 
        return
      }
      domains = domains.concat(data.domainInfos.map((di) => di.name))
    })
  })
  app.get('/domains/:domainId/workflows', (req, res, next) => {
    const closed = req.query.closed || false
    const opts: SWF.ListOpenWorkflowExecutionsInput | SWF.ListClosedWorkflowExecutionsInput = {
      domain: req.param('domainId'),
      nextPageToken: req.query.nextPageToken,
      tagFilter: req.query.tags,
      maximumPageSize: req.query.maxPageSize || 500,
      typeFilter: {
        name: config.workflowName
      }
    }
    if (closed) {
      swfClient.listClosedWorkflowExecutions(opts as SWF.ListClosedWorkflowExecutionsInput, (err, data) => {
        if (err) return next(err)
        res.json({success: true, data: data.executionInfos})
      })
    } else {
      swfClient.listOpenWorkflowExecutions(opts as SWF.ListOpenWorkflowExecutionsInput, (err, data) => {
        if (err) return next(err)
        res.json({success: true, data: data.executionInfos})
      })
    }
  })
  app.get('/domains/:domainId/workflows/:workflowId/:runId', (req, res, next) => {
    let events: SWF.HistoryEvent[] = []
    swfClient.getWorkflowExecutionHistory({
      domain: req.param('domainId'),
      execution: {workflowId: req.param('workflowId'), runId: req.param('runId')}
    }).eachPage((err, data) => {
      if (err) return next(err)
      if (!data) {
        res.json({success: true, data: processEvents(data)})
        return
      }
      events = events.concat(data.events)
    })
  })
  return app

}
