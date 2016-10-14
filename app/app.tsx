import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { Router, browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'

import configureStore from './store/configureStore'
import routes from './routes'

const store = configureStore({domains: []})

const history = syncHistoryWithStore(browserHistory, store)

export default class App extends React.Component<void, void> {
  render() {
    return (
      <Provider store={ store }>
        <Router history={ history }>
          { routes }
        </Router>
      </Provider>
    )
  }
}
