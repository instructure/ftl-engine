import * as Actions from '../actions'
const objectAssign = require('object-assign')
export default {
  [Actions.START_CHANGE_WORKFLOW]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      changeWorkflow: true
    })
  },
  [Actions.STOP_CHANGE_WORKFLOW]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      changeWorkflow: false
    })
  },
  [Actions.GOT_WORKFLOWS]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      workflows: action.payload
    })
  },
  [Actions.CHANGE_WORKFLOW_FETCH]: (state: any = {}, action) => {
    const oldFetchOpts = state.workflowFetchOpts
    return objectAssign({}, state, {
      workflowFetchOpts: objectAssign({}, oldFetchOpts, action.payload)
    })
  },
  [Actions.WORKFLOW_SELECTED]: (state: any = {}, action) => {
    const highlightedWorkflowIndex = state.highlightedWorkflow
    const workflow = state.workflows[highlightedWorkflowIndex]
    if (!workflow) throw new Error('unexpected, cannnot find highligted workflow')
    return objectAssign({}, state, {
      selectedWorkflow: workflow.execution
    })
  },
  [Actions.WORKFLOW_HIGHLIGHTED]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      highlightedWorkflow: action.payload
    })
  },
  [Actions.UNLOAD_WORKFLOW]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      loadedWorkflow: null
    })
  },
  [Actions.WORKFLOW_LOADED]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      loadedWorkflow: action.payload
    })
  }
}
