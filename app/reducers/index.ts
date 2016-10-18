import { handleActions } from 'redux-actions'
import { combineReducers, Action, Reducer } from 'redux'
import { routerReducer } from 'react-router-redux'
import { reducer as formReducer } from 'redux-form'

import WorkflowReducers from './workflow'
import DomainReducers from './domain'
import WorkflowTreeReducers from './workflowTree'
import GraphReducers from './graph'
import * as Actions from '../actions'

import { AllState } from '../types'

const objectAssign = require('object-assign')

const appReducers = {
  [Actions.CREATE_API]: (state: any = {}, action) => {
    return objectAssign({}, state, {
      api: action.payload
    })
  }
}

const appReducer = handleActions(
  objectAssign(
    appReducers,
    DomainReducers,
    WorkflowReducers,
    WorkflowTreeReducers,
    GraphReducers
  )
)

function ensureObj(...args: any[]) {
  return appReducer.call(appReducer, ...args) || {}
}
export default combineReducers<AllState>({
  app: ensureObj,
  routing: routerReducer,
  form: formReducer
})
