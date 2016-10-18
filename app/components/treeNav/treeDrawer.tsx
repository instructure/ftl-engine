import * as React from 'react'
import { connect } from 'react-redux'
import * as _ from 'lodash'

import Drawer from 'material-ui/Drawer'

import {
  AllState,
  GraphExecutionHistory,
  TaskGraphGraphNode,
  TaskGraphNode,
  TaskGraphGraph
} from '../../types'

import {
  toggleWorkflowTree,
  selectFocusItem,
  toggleExpandWorkflow,
  selectSubGraph
} from '../../actions'
import TreeItem from './treeItem'


export interface ITreeDrawerP extends React.Props<any> {
  open: boolean
  workflow?: GraphExecutionHistory
  focusedWorkflowItem: string
  workflowExpandedStates: {[id: string]: boolean}
}
export interface ITreeDrawerD extends React.Props<any> {
  onClose(): any
  onSelect(id: string): any
  onExpand(id: string): any
}

export interface ITreeDrawer extends ITreeDrawerP, ITreeDrawerD {
}

// traverse the graph (BFS) to get an ordering
// we need to traverse in reverse direction (starting with sink)
// and then reverse it
export function orderNodes(graph: TaskGraphGraph): TaskGraphNode[] {
  const visited: {[id: string]: boolean} = {}
  const toCheck = [graph.sinkNode]
  const nodes: TaskGraphNode[] = []
  const sourceNode = graph.sourceNode
  while (toCheck.length) {
    const next = toCheck.shift()!
    if (!visited[next]) {
      visited[next] = true
      nodes.push(graph.nodes[next])
      const nextEdges = graph.edges[next]
      toCheck.push(...nextEdges)
    }
  }
  return nodes.reverse()
}

export class TreeDrawer extends React.Component<ITreeDrawer, void> {
  buildChildrenItems() {
    if (!this.props.workflow) return
    if (!this.props.open) return
    // we know top level is always a node with a graph
    const wf = this.props.workflow.wfInput.input as TaskGraphGraphNode
    const nodes = orderNodes(wf.parameters.graph)
    return nodes.map((node) => {
      return <TreeItem
        key={node.id}
        node={node}
        depth={1}
        onSelect={this.props.onSelect}
        onExpand={this.props.onExpand}
        focusedWorkflowItem={this.props.focusedWorkflowItem}
        workflowExpandedStates={this.props.workflowExpandedStates}
      />
    })
  }
  render() {
    return (
      <Drawer width={500} open={this.props.open} docked={false} onRequestChange={this.props.onClose}>
        {this.buildChildrenItems()}
      </Drawer>
    )
  }
}

const BoundTreeDrawer = connect<ITreeDrawerP, ITreeDrawerD, void>(
  (state: AllState) => {
    return {
      open: state.app.workflowTreeOpen,
      workflow: state.app.loadedWorkflow,
      focusedWorkflowItem: state.app.focusedWorkflowItem,
      workflowExpandedStates: state.app.workflowExpandedStates
    } as ITreeDrawerP
  },
  (dispatch) => {
    return {
      onClose() {
        dispatch(toggleWorkflowTree())
      },
      onSelect(type: 'workflow' | 'activity', id: string) {
        if (type === 'activity') {
          dispatch(selectFocusItem(id))
        } else {
          dispatch(selectSubGraph(id))
        }
        dispatch(toggleWorkflowTree())
      },
      onExpand(id: string) {
        dispatch(toggleExpandWorkflow(id))
      }
    } as ITreeDrawerD
  }
)(TreeDrawer)

export default BoundTreeDrawer
