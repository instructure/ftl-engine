import * as React from 'react'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'

import MainNav from './nav/mainNav'
import WorkflowModal from './workflowModal'
import TreeActionButton from './treeNav/treeActionButton'
import TreeDrawer from './treeNav/treeDrawer'
import GraphContainer from './graph/graphContainer'

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
            <TreeActionButton />
            <TreeDrawer />
            <GraphContainer />
          </main>
        </div>
      </MuiThemeProvider>
    )
  }
}
