import { createAction, Action } from 'redux-actions'
import {
  WorkflowId,
  WorkflowQueryOpts,
  getState,
  AllState
} from '../types'
import { buildGraph } from './graph'

export const GOT_WORKFLOWS = 'gotWorkflows'
export const gotWorkflows = createAction(GOT_WORKFLOWS)

export const FETCH_WORKFLOWS_FAILED = 'fetchWorkflowsFailed'
export const fetchWorkflowsFailed = createAction(FETCH_WORKFLOWS_FAILED)

export const WORKFLOW_SELECTED = 'selectedWorkflow'
export const workflowSelected = createAction(WORKFLOW_SELECTED)

export const START_CHANGE_WORKFLOW = 'startChangeWorkfow'
export const startChangeWorkflow = createAction(START_CHANGE_WORKFLOW)

export const STOP_CHANGE_WORKFLOW = 'stopChangeWorkfow'
export const stopChangeWorkflow = createAction(STOP_CHANGE_WORKFLOW)

export const WORKFLOW_HIGHLIGHTED = 'workflowHighlighted'
export const workflowHighlighted = createAction(WORKFLOW_HIGHLIGHTED)

export const CHANGE_WORKFLOW_FETCH = 'changeWorkflowFetch'
export const changeWorkflowFetch = createAction(CHANGE_WORKFLOW_FETCH)

export const UNLOAD_WORKFLOW = 'unloadWorkflow'
export const unloadWorkflow = createAction(UNLOAD_WORKFLOW)

export const WORKFLOW_LOADED = 'workflowLoaded'
export const workflowLoaded = createAction(WORKFLOW_LOADED)

export function combineDate(date: Date, time: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  ).valueOf()
}
export function convertWorkflowFetchOpts(opts: WorkflowQueryOpts) {
  const oldestDate = combineDate(opts.startDate, opts.startTime)
  const latestDate = combineDate(opts.endDate, opts.endTime)
  return {
    closed: opts.closedWorkflows,
    oldestDate,
    latestDate
  }

}
export function getWorkflows() {
  return (dispatch, getState: getState) => {
    const state = getState().app
    const selectedDomain = state.selectedDomain
    const query = convertWorkflowFetchOpts(state.workflowFetchOpts || {})
    if (!selectedDomain) return dispatch(fetchWorkflowsFailed('no domain selected'))
    state.api.listWorkflows(selectedDomain, query, (err, data) => {
      if (err) return dispatch(fetchWorkflowsFailed(err.message))
      dispatch(gotWorkflows(data))
    })
  }
}

export function loadWorkflow() {
  return (dispatch, getState: getState) => {
    const state = getState().app
    if (!state.selectedWorkflow) return dispatch(unloadWorkflow())
    const selectedDomain = state.selectedDomain
    if (!selectedDomain) return dispatch(fetchWorkflowsFailed('no domain selected'))
    const selectedWorkflow = state.selectedWorkflow
    state.api.getWorkflow(selectedWorkflow, selectedDomain, (err, data) => {
      if (err) return dispatch(fetchWorkflowsFailed(err.message))
      dispatch(workflowLoaded(data))
      dispatch(buildGraph(data!.wfInput.input))
    })
  }
}
