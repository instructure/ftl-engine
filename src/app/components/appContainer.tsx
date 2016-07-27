import * as React from 'react'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import DomainMenu, {IDomainMenu} from './domainMenu'
import WorkflowToolGroup, {IWorkflowToolGroup} from './workflowToolGroup'

import getMuiTheme from 'material-ui/styles/getMuiTheme'

export interface IAppProps extends IDomainMenu, IWorkflowToolGroup {

}
export default class AppContainer extends React.Component<IAppProps, void> {
  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div>
          <nav>
            <Toolbar>
              <ToolbarGroup firstChild={true}>
                <ToolbarTitle text='FTL Engine' />
                <ToolbarSeparator />
                <ToolbarTitle text='Selected Domain: ' />
                <DomainMenu
                  selectedDomain={this.props.selectedDomain}
                  domains={this.props.domains}
                  onDomainChange={this.props.onDomainChange}
                />
              </ToolbarGroup>
              <WorkflowToolGroup
                selectedWorkflow={this.props.selectedWorkflow}
                workflowStatus={this.props.workflowStatus}
                openChangeWorkflow={this.props.openChangeWorkflow}
              />
            </Toolbar>
          </nav>
          <main>
          </main>
        </div>
      </MuiThemeProvider>
    )
  }
}
