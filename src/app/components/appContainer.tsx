import * as React from 'react'
import { connect } from 'react-redux'

import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

import MainNav from './nav/mainNav'
import WorkflowModal from './workflowModal'
import { IWorkflowId, IWorkflowInfo } from '../types'


export interface IAppProps extends React.Props<any> {
}

export default class AppContainer extends React.Component<IAppProps, void> {
  render() {
    return (
      <MuiThemeProvider>
        <div>
          <WorkflowModal />
          <MainNav />
          <main>
          </main>
        </div>
      </MuiThemeProvider>
    )
  }
}
