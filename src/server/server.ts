import * as express from 'express'
import * as path from 'path'
const browserify = require('browserify-middleware')
import { SWF } from 'aws-sdk'
import * as Domain from 'simple-swf/build/src/entities/Domain'
import * as Workflow from 'simple-swf/build/src/entities/Workflow'
import * as WorkflowExecution from 'simple-swf/build/src/entities/WorkflowExecution'
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
    Domain.Domain.listDomains(config.swfConfig, swfClient, 'REGISTERED', (err, domains) => {
      if (err) return next(err)
      res.json({success: true, data: domains!.map((d) => d.name)})
    })
  })
  function getDate(ts, buildDefault) {
    return ts ? moment(parseInt(ts, 10)).unix() : buildDefault().unix()
  }
  app.get('/domains/:domainId/workflows', (req, res, next) => {
    const closed = req.query.closed === 'true' ? true : false
    const domain = Domain.Domain.loadDomain(config.swfConfig, swfClient, req.params.domainId)
    const opts: any = {
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
    const castOpts =  closed ? opts as Domain.ClosedFilter : opts as Domain.ListFilter
    const method = closed ? domain.listClosedWorkflowExecutions : domain.listOpenWorkflowExecutions
    method.call(domain, config.fieldSerializer, castOpts, (err, wfExections?: WorkflowExecution.WorkflowExecution[]) => {
      if (err) return next(err)
      const executions = (wfExections || []).map((wf) => wf.toJSON())
      res.json({success: true, data: executions})
    })
  })
  app.get('/domains/:domainId/workflows/:workflowId/:runId', (req, res, next) => {
    const domain = Domain.Domain.loadDomain(config.swfConfig, swfClient, req.params.domainId)
    const wfId = decodeURIComponent(req.params.workflowId)
    const runId = decodeURIComponent(req.params.runId)
    const wf = new Workflow.Workflow(domain, config.workflowName, config.defaultVersion, config.fieldSerializer)
    const wfExec = new WorkflowExecution.WorkflowExecution(wf, {workflowId: wfId, runId})
    wfExec.getWorkflowExecutionHistory({}, (err, hist) => {
      if (err) return next(err)
      res.json({
        success: true,
        data: hist
      })
    })
  })
  return app

}
