import * as React from 'react'
import * as d3Force from 'd3-force'

export interface IGraphNode<T> extends d3Force.SimulationNodeDatum {
  type: 'activity' | 'workflow' | 'marker'
  id: string
  value: T
}
export interface IGraphLink<T> extends d3Force.SimulationLinkDatum<T> {
}
export interface IGraphP<T> extends React.Props<any> {
  width: number
  height: number
  nodes: IGraphNode<T>[]
  links: IGraphLink<IGraphNode<T>>[]
}
export interface IGraphD<T> extends React.Props<any> {
  layoutUpdated(nodes: T[]): any
}
export interface IGraph<T> extends IGraphP<T>, IGraphD<T> {
}
export interface IGraphChildProps extends React.Props<any> {


}


export default class Graph<T> extends React.Component<IGraph<T>, void> {
  nodeRadius?: number
  linkDistance?: number
  layout: d3Force.Simulation<IGraphNode<T>, IGraphLink<IGraphNode<T>>> | null

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
    const {width, height, nodes, links} = this.props

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
  }
  componentDidUnmount() {
    this.layout = null
  }
  render() {
    return (
      <svg height={this.props.height} width={this.props.width}>
        {React.Children.map(this.props.children || {}, (child) => {

        })}
      </svg>
    )
  }
}
