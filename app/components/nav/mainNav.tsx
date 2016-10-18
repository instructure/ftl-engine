import * as React from 'react'
import { connect } from 'react-redux'

import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'

import WorkflowToolGroup, {IWorkflowToolGroup, IWorkflowToolGroupP, IWorkflowToolGroupD} from './workflowToolGroup'
import DomainMenu, {IDomainMenu, IDomainMenuP, IDomainMenuD} from './domainMenu'
import { domainSelected, getWorkflows, startChangeWorkflow } from '../../actions'
import { AllState } from '../../types'

export interface IMainNavPropsP extends IWorkflowToolGroupP, IDomainMenuP {
}
export interface IMainNavPropsD extends IWorkflowToolGroupD, IDomainMenuD {
}
export interface IMainNavProps extends IMainNavPropsP, IMainNavPropsD {
}


export class MainNav extends React.Component<IMainNavProps, void> {
  render() {
    return (
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
            haveDomain={this.props.haveDomain}
          />
        </Toolbar>
      </nav>
    )
  }
}


const MainNavBound = connect<IMainNavPropsP, IMainNavPropsD, void>(
  (state: AllState) => {
    return {
      selectedDomain: state.app.selectedDomain,
      domains: state.app.domains,
      selectedWorkflow: state.app.selectedWorkflow,
      // TODO: getworkflow state
      workflowStatus: 'Unknown',
      haveDomain: state.app.selectedDomain ? true : false
    } as IMainNavPropsP
  },
  (dispatch) => {
    return {
      onDomainChange(event, key, domain) {
        dispatch(domainSelected(domain))
        dispatch(getWorkflows())
      },
      openChangeWorkflow() {
        dispatch(startChangeWorkflow())
      }
    } as IMainNavPropsD
  }
)(MainNav)

export default MainNavBound
