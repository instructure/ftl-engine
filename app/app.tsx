import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider, Store } from 'react-redux'
import { Router } from 'react-router'
import { ReactRouterReduxHistory } from 'react-router-redux'

import routes from './routes'
import { AllState } from './types'

export interface IApp extends React.Props<any> {
  store: Store<AllState>
  history: ReactRouterReduxHistory
}

export default class App extends React.Component<IApp, void> {
  render() {
    return (
      <Provider store={ this.props.store }>
        <Router history={ this.props.history }>
          { routes }
        </Router>
      </Provider>
    )
  }
}
