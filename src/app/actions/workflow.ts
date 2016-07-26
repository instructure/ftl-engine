import * as superagent from 'superagent'
import { createAction } from 'redux-actions'

export const GOT_WORKFLOWS = 'gotWorkflows'
export const gotWorkflows = createAction(GOT_WORKFLOWS)

export const FETCH_WORKFLOWS_FAILED = 'fetchWorkflowsFailed'
export const fetchWorkflowsFailed = createAction(FETCH_WORKFLOWS_FAILED)

export const WORKFLOW_SELECTED = 'selectedWorkflow'
export const workflowSelected = createAction(WORKFLOW_SELECTED)

export function getWorkflows() {
  return (dispatch, getState) => {
    const selectedDomain = getState().app.selectedDomain
    if (!selectedDomain) return dispatch(fetchWorkflowsFailed('no domain selected'))
    superagent.get(`/domains/${selectedDomain}/workflows`).
    end((err, resp) => {
      if (err) return dispatch(fetchWorkflowsFailed(err.message))
      dispatch(gotWorkflows(resp.body))
    })
  }
}
