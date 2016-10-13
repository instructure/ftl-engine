import { handleActions } from 'redux-actions'
import { combineReducers, Action, Reducer } from 'redux'
import { routerReducer } from 'react-router-redux'
import WorkflowReducers from './workflow'
import DomainReducers from './domain'
const objectAssign = require('object-assign')

const appReducer = handleActions(objectAssign({}, DomainReducers, WorkflowReducers))

function ensureObj(...args: any[]) {
  return appReducer.call(appReducer, ...args) || {}
}
export default combineReducers({app: ensureObj, routing: routerReducer })
