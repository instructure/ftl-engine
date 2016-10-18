import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { syncHistoryWithStore } from 'react-router-redux'
import { browserHistory } from 'react-router'

const { AppContainer } = require('react-hot-loader')

import configureStore from './store/configureStore'
import * as injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

import App from './app'

const store = configureStore({domains: []})
const history = syncHistoryWithStore(browserHistory, store)

const rootEl = document.getElementById('root')!
ReactDOM.render(
  <AppContainer>
    <App store={store} history={history} />
  </AppContainer>,
  rootEl
)

interface HotNodeModule extends NodeModule {
  hot?: {
    accept(path: string, cb: {(): any})
  }
}

const hotModule = module as HotNodeModule
if (hotModule.hot) {
  console.log('things are hot!')
  hotModule.hot.accept('./app/app.tsx', () => {
    console.log('Attempting to load new app')
    let LoadApp: { new(): App }
    try {
      LoadApp = require('./app').default as { new(): App }
    } catch(e) {
      console.error(e)
      throw e
    }
    const NextApp = LoadApp
    console.log('Have new app?', !!NextApp!)
    ReactDOM.render(
      <AppContainer>
         <NextApp store={store} history={history} />
      </AppContainer>,
      rootEl
    )
  })
}
