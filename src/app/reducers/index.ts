import { handleActions } from 'redux-actions'
import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import * as Actions from '../actions'
import * as _ from 'lodash'

const appReducer = handleActions({
  [Actions.FETCH_DOMAINS_FAILED]: (state: any = {}, action) => {
    let newState = _.clone(state)
    newState.err = action.payload
    return state
  },
  [Actions.GOT_DOMAINS]: (state: any = {}, action) => {
    let newState = _.cloneDeep(state)
    newState.domains = action.payload
    return newState
  }
})
function ensureObj(...args: any[]) {
  return appReducer.call(appReducer, ...args) || {}
}
export default combineReducers({app: ensureObj, routing: routerReducer })
