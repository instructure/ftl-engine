import { createAction, Action } from 'redux-actions'

export const TOGGLE_WORKFLOW_TREE = 'toggleWorkflowTree'
export const toggleWorkflowTree = createAction(TOGGLE_WORKFLOW_TREE)

export const TOGGLE_EXPAND_WORKFLOW = 'toggleExpandWorkflow'
export const toggleExpandWorkflow = createAction(TOGGLE_EXPAND_WORKFLOW)

export const SELECT_FOCUS_ITEM = 'selectFocusItem'
export const selectFocusItem = createAction(SELECT_FOCUS_ITEM)
