import * as express from 'express'
import * as path from 'path'
const browserify = require('browserify-middleware')
import { SWF } from 'aws-sdk'
import { processEvents } from 'simple-swf/build/src/tasks/processEvents'
import { Config } from '../Config'
import * as moment from 'moment'

function buildDefaultLatestDate() {
  return moment().toDate()
}
function buildDefaultOldDate() {
  return moment().subtract(1, 'day').toDate()
}
export function buildServer(config: Config): express.Express {
  const app: express.Express = express()
  const swfClient = config.swfClient
  app.use('/', express.static(path.join(__dirname, 'public')))
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
      if (!data) {
        res.json({success: true, data: domains})
        return
      }
      domains = domains.concat(data.domainInfos.map((di) => di.name))
    })
  })
  function getDate(ts, buildDefault) {
    return ts ? moment(parseInt(ts, 10)).unix() : buildDefault().unix()
  }
  app.get('/domains/:domainId/workflows', (req, res, next) => {
    const closed = req.query.closed === 'true' ? true : false
    const opts: any = {
      domain: req.params.domainId,
      maximumPageSize: req.query.maxPageSize || 500,
      startTimeFilter: {
        oldestDate: getDate(req.query.oldestDate, buildDefaultOldDate),
        latestDate: getDate(req.query.latestDate, buildDefaultLatestDate)
      }
    }
    if (req.query.tag) {
      opts.tagFilter = {tag: req.query.tag}
    } else if (req.query.workflowId) {
      opts.executionFilter = {workflowId: req.query.workflowId}
    } else {
      opts.typeFilter = {
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
        console.log(data.executionInfos[0])
        res.json({success: true, data: data.executionInfos})
      })
    }
  })
  function deserializeEvents(events: SWF.HistoryEvent[], cb) {


  }
  app.get('/domains/:domainId/workflows/:workflowId/:runId', (req, res, next) => {
    let events: SWF.HistoryEvent[] = []
    const wfId = decodeURIComponent(req.params.workflowId)
    const runId = decodeURIComponent(req.params.runId)
    swfClient.getWorkflowExecutionHistory({
      domain: req.params.domainId,
      execution: {workflowId: wfId, runId: runId}
    }).eachPage((err, data) => {
      if (err) return next(err)
      if (!data) {
        res.json({
          success: true,
          data: {
            progress: processEvents(events),
            graph: events[0].workflowExecutionStartedEventAttributes

          }
        })
        return
      }
      events = events.concat(data.events)
    })
  })
  return app

}
