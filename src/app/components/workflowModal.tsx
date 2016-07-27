import * as React from 'react'

export interface IWorkflowModal extends React.Props<any> {
  modalOpen: boolean,
}

export default class WorkflowToolGroup extends React.Component<IWorkflowModal, void> {
  render() {
    return (
      <p>Placeholder</p>
    )
  }
}
