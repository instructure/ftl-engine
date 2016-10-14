import * as React from 'react'
import * as ReactDOM from 'react-dom'
const { AppContainer } = require('react-hot-loader')

import * as injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

import App from './app'

const rootEl = document.getElementById('root')!
ReactDOM.render(
  <AppContainer>
    <App />
  </AppContainer>,
  rootEl
)

interface HotNodeModule extends NodeModule {
  hot?: {
    accept(path: string, cb: {(): any})
    accept()
  }
}

const hotModule = module as HotNodeModule
if (hotModule.hot) {
  console.log('things are hot!')
  hotModule.hot.accept('./app/app.tsx', () => {
    console.log('Attempting to load new app')
    try {
      var NextApp = require('./app').default
    } catch(e) {
      console.error(e)
    }
    console.log('Have new app?', !!NextApp)
    ReactDOM.render(
      <AppContainer>
         <NextApp />
      </AppContainer>,
      rootEl
    )
  })
}
