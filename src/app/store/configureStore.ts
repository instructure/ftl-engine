import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import initialState from './initialState'
import thunkMiddleware from 'redux-thunk'
import * as loggerMiddleware from 'redux-logger'
import initialActions from './initialActions'

const logger = loggerMiddleware()
export default function(props: any, state?: any) {
  const store = createStore(
    rootReducer,
    state || initialState(props),
    applyMiddleware(thunkMiddleware, logger)
  )

  initialActions(store)

  return store
}
