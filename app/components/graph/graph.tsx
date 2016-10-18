import * as React from 'react'
import * as d3Force from 'd3-force'

import {
  IGraphNode,
  IGraphLink
} from '../../types'

export interface IGraphP<T> extends React.Props<any> {
  width: number
  height: number
  nodes: IGraphNode<T>[]
  links: IGraphLink<IGraphNode<T>>[]
}
export interface IGraphD<T> extends React.Props<any> {
  layoutUpdated(nodes: IGraphNode<T>[], links: IGraphLink<IGraphNode<T>>[]): any
}
export interface IGraph<T> extends IGraphP<T>, IGraphD<T> {
}

export default class Graph<T> extends React.Component<IGraph<T>, void> {
  nodeRadius?: number
  linkDistance?: number
  layout: d3Force.Simulation<IGraphNode<T>, IGraphLink<IGraphNode<T>>> | null
  nodesById: {[id: string]: T}

  setPosStartNode(node: IGraphNode<T>, idealRadius: number, width: number, height: number): IGraphNode<T> {
    node.fx = idealRadius
    node.fy = idealRadius
    return node
  }
  setPosEndNode(node: IGraphNode<T>, idealRadius: number, width: number, height: number): IGraphNode<T> {
    node.fx = width - idealRadius
    node.fy = height - idealRadius
    return node
  }
  computeNodeRadius(width: number, height: number, numNodes: number) {
    // figure we want to fill roughly 60% of area
    const fillArea = (width * height * .60) / numNodes
    return Math.round(Math.sqrt(fillArea / Math.PI))
  }
  computeLinkDistance(radius: number) {
    // make slighly longer
    return radius * 1.4
  }
  componentDidMount() {
    this.nodesById = {}
    const {width, height} = this.props
    const nodes = this.props.nodes!
    const links = this.props.links!

    this.nodeRadius = this.computeNodeRadius(width, height, nodes.length)
    this.linkDistance = this.computeLinkDistance(this.nodeRadius)
    nodes[0] = this.setPosStartNode(nodes[0], width, height, nodes.length)
    nodes[nodes.length - 1] = this.setPosEndNode(nodes[nodes.length - 1], width, height, nodes.length)
    this.layout = d3Force
    .forceSimulation<IGraphNode<T>, IGraphLink<IGraphNode<T>>>(nodes)
    .force('link',
      d3Force.forceLink<IGraphNode<T>, IGraphLink<IGraphNode<T>>>(links)
      .id((n) => n.id)
      .distance(this.linkDistance)
    )
    .force('center',
      d3Force.forceCenter(Math.round(width / 2), Math.round(height / 2))
    )
    .force('collision', d3Force.forceCollide(this.nodeRadius))
    .on('tick', () => {
      this.props.layoutUpdated(nodes, links)
    })
  }
  componentWillUnmount() {
    this.layout = null
  }
  buildChildren() {
    return this.props.nodes.map((node) => {
      return (
        <circle cx={node.x} cy={node.y} r={this.nodeRadius} />
      )
    })
  }
  render() {
    return (
      <svg height={this.props.height} width={this.props.width}>
        {this.buildChildren()}
      </svg>
    )
  }
}
