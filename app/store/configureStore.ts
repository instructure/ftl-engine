import { createStore, applyMiddleware, compose, Store } from 'redux'
import rootReducer from '../reducers'
import initialState from './initialState'
import thunkMiddleware from 'redux-thunk'
import * as loggerMiddleware from 'redux-logger'
import initialActions from './initialActions'
// let us access window
declare var window:any
import { AllState } from '../types'

const logger = loggerMiddleware()
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
export default function(props: any, state?: any) {
  const store = createStore<AllState>(
    rootReducer,
    state || initialState(props),
    composeEnhancers(applyMiddleware(thunkMiddleware, logger))
  )

  initialActions(store)

  return store
}
