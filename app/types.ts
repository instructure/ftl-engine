import * as serverTypes from '../src/server/interfaces'
import Api from './api'
import {SimulationNodeDatum, SimulationLinkDatum} from 'd3-force'

export interface IGraphNode<T> extends SimulationNodeDatum {
  type: 'activity' | 'workflow' | 'marker'
  id: string
  value: T
}

export interface IGraphLink<T> extends SimulationLinkDatum<T> {
}

export interface TaskGraph {
  nodes: IGraphNode<serverTypes.TaskGraphNode>[],
  links: IGraphLink<IGraphNode<serverTypes.TaskGraphNode>>[]
}

export interface WorkflowQueryOpts {
  closedWorkflows: boolean,
  startDate: Date,
  startTime: Date,
  endDate: Date,
  endTime: Date
}

export interface AppState {
  err?: Error | string | null
  api: Api,
  domains: string[]
  selectedDomain?: string
  changeWorkflow: boolean
  workflowTreeOpen: boolean
  workflows: serverTypes.WorkflowInfo[]
  workflowFetchOpts: WorkflowQueryOpts
  selectedWorkflow?: serverTypes.WorkflowId
  highlightedWorkflow?: number
  loadedWorkflow?: serverTypes.GraphExecutionHistory
  focusedWorkflowItem: string
  workflowExpandedStates: {[id: string]: boolean}
  loadedGraph?: TaskGraph
}

export interface AllState {
  routing?: any,
  form?: any,
  app: AppState
}

export function isTaskGraphGraphNode(node: serverTypes.AllNodeTypes): node is serverTypes.TaskGraphGraphNode {
  return node.type === 'decision' && node.handler === 'taskGraph'
}

export function isTaskGraphMarkerNode(node: serverTypes.AllNodeTypes): node is serverTypes.TaskGraphMarkerNode {
  return node.type === 'decision' && node.handler === 'recordMarker'
}

export function isActivityNode(node: serverTypes.AllNodeTypes): node is serverTypes.TaskGraphActivityNode {
  return node.type === 'activity'
}

export type getState = {(): AllState}

// rexport all types from server
export * from '../src/server/interfaces'
