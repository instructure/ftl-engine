import * as superagent from 'superagent'
import {
  ApiResp,
  WorkflowInfo,
  GraphExecutionHistory,
  WorkflowId
} from '../types'

export type respCb<T> = {(err?: Error | null, d?: T | null)}

export default class Api {
  listDomains(cb: respCb<string[]>) {
    superagent.get('api/domains').
    end((err, resp) => {
      if (err) return cb(err)
      cb(null, resp.body.data)
    })
  }
  listWorkflows(selectedDomain: string, queryOpts: any, cb: respCb<WorkflowInfo[]>) {
    superagent
    .get(`api/domains/${selectedDomain}/workflows`)
    .query(queryOpts)
    .end((err, resp) => {
      if (err) return cb(err)
      cb(null, resp.body.data)
    })
  }
  getWorkflow(id: WorkflowId, selectedDomain: string, cb: respCb<GraphExecutionHistory>) {
    const wfId = encodeURIComponent(id.workflowId)
    const runId = encodeURIComponent(id.runId)
    superagent
    .get(`api/domains/${selectedDomain}/workflows/${wfId}/${runId}`)
    .end((err, resp) => {
      if (err) return cb(err)
      cb(null, resp.body.data)
    })
  }
}
