import * as React from 'react'
import Toggle from 'material-ui/Toggle'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import DatePicker from 'material-ui/DatePicker'
import TimePicker from 'material-ui/TimePicker'
import { Field, reduxForm } from 'redux-form'
import { WorkflowQueryOpts } from '../types'
// currently the TS defs for MakeSelectable are wrong
// as the actual method name is underscore... so hacks...
import * as ListStuff from 'material-ui/List'
const listImport = ListStuff
listImport['MakeSelectable'] = listImport['makeSelectable']

const SelectableList = ListStuff.MakeSelectable(ListStuff.List)

import {WorkflowId, WorkflowInfo} from '../types'

export interface IWorkflowSearchP extends React.Props<any> {
  workflows: WorkflowInfo[]
  highlightedWorkflow: number,
  queryOpts: WorkflowQueryOpts
}
export interface IWorkflowSearchD extends React.Props<any> {
  refreshWorkflows(): any
  workflowHighlighted(): any
  changeQueryOpts(key: string): any,
}

export interface IWorkflowSearch extends IWorkflowSearchP, IWorkflowSearchD {
}


export default class WorkflowSearch extends React.Component<IWorkflowSearch, void> {
  render() {
    return (
      <div>
        <Paper zDepth={1}>
          <Toggle
            label="Search Closed Worfklows"
            value={this.props.queryOpts.closedWorkflows.toString()}
            onToggle={this.props.changeQueryOpts.bind(null, 'closedWorkflows')}
          />
          <Paper zDepth={2}>
            <DatePicker
              id='startDate'
              hintText='Search Range Start Date'
              value={this.props.queryOpts.startDate}
              onChange={this.props.changeQueryOpts.bind(null, 'startDate')}/>
            <TimePicker
              id='startTime'
              hintText='Search Range Start Time'
              value={this.props.queryOpts.startTime}
              onChange={this.props.changeQueryOpts.bind(null, 'startTime')}/>
          </Paper>
          <Paper zDepth={2}>
            <DatePicker
              id='endDate'
              hintText='Search Range End Date'
              value={this.props.queryOpts.endDate}
              onChange={this.props.changeQueryOpts.bind(null, 'endDate')}/>
            <TimePicker
              id='endTime'
              hintText='Search Range End Time'
              value={this.props.queryOpts.endTime}
              onChange={this.props.changeQueryOpts.bind(null, 'endTime')}/>
          </Paper>
          <RaisedButton label='Fetch Workflows' onTouchTap={this.props.refreshWorkflows} />
        </Paper>
        <SelectableList
          value={this.props.highlightedWorkflow}
          onChange={this.props.workflowHighlighted} >
          { this.props && this.props.workflows.map((wf, i) => {
            return (
              <ListStuff.ListItem
                value={i.toString()}
                key={wf.execution.runId}
                primaryText={wf.execution.workflowId}>
              </ListStuff.ListItem>
            )
          })}
        </SelectableList>
      </div>
    )
  }
}
