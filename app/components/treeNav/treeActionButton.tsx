import * as React from 'react'
import { connect } from 'react-redux'

import FloatingActionButton from 'material-ui/FloatingActionButton'
import Menu from 'material-ui/svg-icons/navigation/menu'

import { AllState } from '../../types'
import { toggleWorkflowTree } from '../../actions'

export interface ITreeActionP extends React.Props<any> {
  haveWorkflow: boolean
}
export interface ITreeActionD extends React.Props<any> {
  onClick(): any
}

export interface ITreeActionButton extends ITreeActionP, ITreeActionD {

}
const style = {
  bottom: 20,
  left: 20,
  margin: 0,
  position: 'fixed',
  right: 'auto',
  top: 'auto',
}
export class TreeActionButton extends React.Component<ITreeActionButton, void> {
  render() {
    return (
      <FloatingActionButton style={style} disabled={this.props.haveWorkflow} onClick={this.props.onClick}>
        <Menu />
      </FloatingActionButton>
    )
  }
}
const BoundTreeActionButton = connect<ITreeActionP, ITreeActionD, void>(
  (state: AllState) => {
    return {
      haveWorkflow: state.app.selectedWorkflow ? false : true
    } as ITreeActionP
  },
  (dispatch) => {
    return {
      onClick() {
        dispatch(toggleWorkflowTree())
      }
    } as ITreeActionD
  }
)(TreeActionButton)

export default BoundTreeActionButton
