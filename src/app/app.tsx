import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { Router, browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import configureStore from './store/configureStore'
import routes from './routes'

import * as injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

const store = configureStore({domains: []})

const history = syncHistoryWithStore(browserHistory, store)
ReactDOM.render(
  <div>
    <Provider store={ store }>
      <Router history={ history }>
        { routes }
      </Router>
    </Provider>
  </div>,
  document.getElementById('root')!
)
