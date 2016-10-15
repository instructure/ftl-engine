import * as React from 'react'
import { connect } from 'react-redux'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import {IWorkflowId, IWorkflowInfo} from '../types'
import WorkflowSearch, {IWorkflowSearch, IWorkflowSearchP, IWorkflowSearchD} from './workflowSearch'

import {stopChangeWorkflow, workflowSelected, workflowHighlighted} from './../actions'
import {getWorkflows, changeWorkflowFetch, loadWorkflow} from './../actions'

export interface IWorkflowModalP extends IWorkflowSearchP {
  workflowModalOpen: boolean
  workflows: IWorkflowInfo[]
}
export interface IWorkflowModalD extends IWorkflowSearchD {
  handleWorkflowSelect(): any
  handleWorkflowCancel(): any
}
export interface IWorkflowModal extends IWorkflowModalP, IWorkflowModalD {
}

export class WorkflowModal extends React.Component<IWorkflowModal, void> {
  buildActions() {
    return [
      <FlatButton
        label="Cancel"
        primary={true}
        onTouchTap={this.props.handleWorkflowCancel}
      />,
      <FlatButton
        label="Select"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.props.handleWorkflowSelect}
      />,
    ]
  }
  render() {
    return (
      <Dialog
        title="Selct Workflow"
        actions={this.buildActions()}
        modal={false}
        open={this.props.workflowModalOpen}
        onRequestClose={this.props.handleWorkflowSelect}
      >
      <WorkflowSearch
          workflows={this.props.workflows}
          queryOpts={this.props.queryOpts}
          highlightedWorkflow={this.props.highlightedWorkflow}
          changeQueryOpts={this.props.changeQueryOpts}
          refreshWorkflows={this.props.refreshWorkflows}
          workflowHighlighted={this.props.workflowHighlighted}
        />
      </Dialog>
    )
  }
}

const WorkflowModalBound = connect<IWorkflowModalP, IWorkflowModalD, void>(
  (state) => {
    return {
      workflows: state.app.workflows as IWorkflowInfo[],
      workflowModalOpen: state.app.changeWorkflow as boolean,
      highlightedWorkflow: state.app.highlightedWorkflow as number,
      queryOpts: {
        closedWorkflows: (state.app.workflowFetchOpts || {}).closed || false as boolean,
        startDate: (state.app.workflowFetchOpts || {}).startDate as Date,
        startTime: (state.app.workflowFetchOpts || {}).startTime as Date,
        endDate: (state.app.workflowFetchOpts || {}).endDate as Date,
        endTime: (state.app.workflowFetchOpts || {}).endTime as Date,
      }
    } as IWorkflowModalP
  },
  (dispatch) => {
    return {
      handleWorkflowSelect() {
        dispatch(workflowSelected())
        dispatch(stopChangeWorkflow())
        dispatch(loadWorkflow())
      },
      handleWorkflowCancel() {
        dispatch(stopChangeWorkflow())
      },
      refreshWorkflows() {
        dispatch(getWorkflows())
      },
      changeQueryOpts(fieldName, event, value) {
        dispatch(changeWorkflowFetch({[fieldName]: value}))
      },
      workflowHighlighted(event, workflowIndex) {
        dispatch(workflowHighlighted(workflowIndex))
      }
    } as IWorkflowModalD
  }
)(WorkflowModal)

export default WorkflowModalBound
