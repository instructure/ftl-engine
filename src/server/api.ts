import * as express from 'express'
import * as moment from 'moment'

import * as Domain from 'simple-swf/build/src/entities/Domain'
import * as Workflow from 'simple-swf/build/src/entities/Workflow'
import * as WorkflowExecution from 'simple-swf/build/src/entities/WorkflowExecution'

import { Config } from '../Config'
import * as types from './interfaces'


function buildDefaultLatestDate() {
  return moment().toDate()
}
function buildDefaultOldDate() {
  return moment().subtract(1, 'day').toDate()
}

export function buildApi(config: Config): express.Router {
  const apiRouter = express.Router()
  const swfClient = config.swfClient
  apiRouter.get('/domains', (req, res, next) => {
    Domain.Domain.listDomains(config.swfConfig, swfClient, 'REGISTERED', (err, domains) => {
      if (err) return next(err)
      res.json({success: true, data: domains!.map((d) => d.name)} as types.ListDomainsResp)
    })
  })
  function getDate(ts, buildDefault) {
    return ts ? moment(parseInt(ts, 10)).unix() : buildDefault().unix()
  }
  apiRouter.get('/domains/:domainId/workflows', (req, res, next) => {
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
      const executions = (wfExections || []).map((wf) => wf.toJSON() as types.WorkflowInfo)
      res.json({success: true, data: executions} as types.ListWorkflowsResp)
    })
  })
  apiRouter.get('/domains/:domainId/workflows/:workflowId/:runId', (req, res, next) => {
    const domain = Domain.Domain.loadDomain(config.swfConfig, swfClient, req.params.domainId)
    const wfId = decodeURIComponent(req.params.workflowId)
    const runId = decodeURIComponent(req.params.runId)
    const wf = new Workflow.Workflow(domain, config.workflowName, config.defaultVersion, config.fieldSerializer)
    const wfExec = new WorkflowExecution.WorkflowExecution(wf, {workflowId: wfId, runId})
    wfExec.getWorkflowExecutionHistory({}, (err, hist: types.GraphExecutionHistory) => {
      if (err) return next(err)
      res.json({
        success: true,
        data: hist
      } as types.GetWorkflowResp)
    })
  })
  return apiRouter
}
