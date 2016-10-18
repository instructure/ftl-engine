import * as Actions from '../actions'
const objectAssign = require('object-assign')

export default {
  [Actions.TOGGLE_WORKFLOW_TREE]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      workflowTreeOpen: !state.workflowTreeOpen
    })
  },
  [Actions.TOGGLE_EXPAND_WORKFLOW]: (state: any = {}, action) => {
    const expandedStates = objectAssign({}, state.workflowExpandedStates, {
      [action.payload]: !state.workflowExpandedStates[action.payload]
    })
    return objectAssign({}, state, {
      workflowExpandedStates: expandedStates
    })
  },
  [Actions.SELECT_FOCUS_ITEM]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      focusedWorkflowItem: action.payload
    })
  },

}
