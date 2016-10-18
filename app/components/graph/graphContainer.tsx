import * as React from 'react'
import { connect } from 'react-redux'
import { graphUpdated } from '../../actions'

import {
  AllState,
  IGraphNode,
  IGraphLink,
  TaskGraphNode,
  TaskGraphGraphNode,
  TaskGraph,
  isTaskGraphGraphNode,
  isActivityNode
} from '../../types'

import Graph, {IGraphP, IGraphD} from './graph'

export interface IGraphContainerP extends IGraphP<TaskGraphNode> {
}
export interface IGraphContainerD extends IGraphD<TaskGraphNode> {
}
export interface IGraphContainer extends IGraphContainerP, IGraphContainerD {
}

interface GraphTaskGraph {
  new(): Graph<TaskGraphNode>
}
const GraphTaskGraph = Graph as GraphTaskGraph

export class GraphContainer extends React.Component<IGraphContainer, void> {

  buildGraph() {
    if (!this.props.nodes) return
    console.log('this should not happen', this.props.nodes)
    return (
      <GraphTaskGraph
        nodes={this.props.nodes}
        links={this.props.links}
        width={this.props.width}
        height={this.props.height}
        layoutUpdated={this.props.layoutUpdated}
      />
    )
  }
  render() {
    return (
      <div>
        {this.buildGraph()}
      </div>
    )
  }
}

const GraphContainerBound = connect<IGraphP<TaskGraphNode>, IGraphD<TaskGraphNode>, void>(
  (state: AllState) => {
    const g = state.app.loadedGraph || {nodes: null, links: null}
    return {
      nodes: g.nodes,
      links: g.links,
      height: window.innerHeight - 50,
      width: window.innerWidth - 50
    } as IGraphP<TaskGraphNode>
  },
  (dispatch) => {
    return {
      layoutUpdated(nodes: IGraphNode<TaskGraphNode>[], links: IGraphLink<IGraphNode<TaskGraphNode>>[]) {
        dispatch(graphUpdated({nodes, links}))
      }
    } as IGraphD<TaskGraphNode>
  }
)(GraphContainer)

export default GraphContainerBound
