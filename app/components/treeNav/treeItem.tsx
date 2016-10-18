import * as React from 'react'
import * as _ from 'lodash'

import Avatar from 'material-ui/Avatar'
import {ListItem} from 'material-ui/List'
import Paper from 'material-ui/Paper'
import CheckCircle from 'material-ui/svg-icons/action/check-circle'

import {
  TaskGraphNode,
  TaskGraphActivityNode,
  isTaskGraphGraphNode,
  isTaskGraphMarkerNode,
  isActivityNode
} from '../../types'

import {orderNodes} from './treeDrawer'

export interface ITreeItemP extends React.Props<any> {
  node: TaskGraphNode
  depth: number
  focusedWorkflowItem: string
  workflowExpandedStates: {[id: string]: boolean}
}

export interface ITreeItemD extends React.Props<any> {
  onSelect(type: 'workflow' | 'activity', id: string): any
  onExpand(id: string): any
}

export interface ITreeItem extends ITreeItemP, ITreeItemD {
}

export default class TreeItem extends React.Component<ITreeItem, void> {
  isActivity() {
    return isActivityNode(this.props.node)
  }
  isMarker() {
    return isTaskGraphMarkerNode(this.props.node)
  }
  isWorkflow() {
    return isTaskGraphGraphNode(this.props.node)
  }
  isFocused() {
    return this.props.node.id === this.props.focusedWorkflowItem
  }
  isExpanded() {
    return this.props.workflowExpandedStates[this.props.node.id] || false
  }
  isFocusedIcon() {
    if (this.isFocused()) {
      return <CheckCircle />
    }
  }
  getLeftIcon() {
    let letter: string = ''
    if (this.isMarker()) letter = 'M'
    if (this.isWorkflow()) letter = 'W'
    if (this.isActivity()) letter = 'A'
    return <Avatar size={30} style={{margin: 5}}>{letter}</Avatar>
  }
  renderActivity() {
    return null
  }
  renderWorkflow() {
    if (!this.isExpanded()) return null
    const nodes = orderNodes(this.props.node.parameters.graph)

    const nextLevelNodes = nodes.map((node) => {
      return <TreeItem
        key={node.id}
        node={node}
        depth={this.props.depth + 1}
        onSelect={this.props.onSelect}
        focusedWorkflowItem={this.props.focusedWorkflowItem}
        workflowExpandedStates={this.props.workflowExpandedStates}
        onExpand={this.props.onExpand}
      />
    })

    return (
      <Paper style={{marginLeft: this.props.depth * 10}} zDepth={this.props.depth + 1}>
        {this.getFocusWorkflow()}
        {nextLevelNodes}
      </Paper>
    )
  }
  getFocusWorkflow() {
    <ListItem
      disabled={this.isFocused()}
      primaryText='Focus Workflow'
      onTouchTap={this.props.onSelect.bind(this, 'workflow')}
      rightIcon={this.isFocusedIcon()}
    />
  }
  renderMarker() {
    // don't render anything else
    return null
  }
  renderChildren(): JSX.Element | null {
    if (this.isMarker()) {
      return this.renderMarker()
    } else if (this.isWorkflow()) {
      return this.renderWorkflow()
    } else {
      return this.renderActivity()
    }
  }
  buildSecondaryText() {
    if (this.isActivity()) {
      return `type: ${this.props.node.handler}`
    }
    return
  }
  onSelect() {
    if (this.isWorkflow()) {
      this.props.onExpand(this.props.node.id)
    } else if (this.isActivity()) {
      this.props.onSelect('activity', this.props.node.id)
    }
  }
  render() {
    return (
      <div>
        <ListItem
          disabled={this.isMarker()}
          primaryText={this.props.node.name}
          onTouchTap={this.onSelect.bind(this)}
          leftAvatar={this.getLeftIcon()}
          rightIcon={this.isFocusedIcon()}
          secondaryText={this.buildSecondaryText()}
        />
        {this.renderChildren()}
      </div>
    )
  }
}
