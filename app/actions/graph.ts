import * as superagent from 'superagent'
import { createAction, Action } from 'redux-actions'
import * as _ from 'lodash'

import {
  WorkflowId,
  TaskGraphGraphNode,
  TaskGraphNode,
  IGraphNode,
  IGraphLink,
  GraphExecutionHistory,
  getState,
  AllState
} from '../types'
import {fetchWorkflowsFailed} from './workflow'

export const GRAPH_LOADED = 'graphLoaded'
export const graphLoaded = createAction(GRAPH_LOADED)
export const GRAPH_UPDATED = 'graphUpdated'
export const graphUpdated = createAction(GRAPH_UPDATED)

export function buildGraph(tg: TaskGraphGraphNode) {
  return (dispatch, getState) => {
    const topLevelNodes = _.values(tg.parameters.graph.nodes).map((n) => {
      return {
        type: n.type,
        id: n.id,
        value: n
      } as IGraphNode<TaskGraphNode>
    })
    const edges = tg.parameters.graph.edges
    const links: IGraphLink<TaskGraphNode>[] = []
    for (let s in edges) {
      const l = edges[s].map((t) => ({source:s, target: t}))
      links.push(...l)
    }
    dispatch(graphLoaded({nodes: topLevelNodes, links}))
  }
}

// traverse the graph (BFS) to find the graph that matches
export function findInGraph(input: TaskGraphGraphNode, id: string): TaskGraphGraphNode | null {
  const graph = input.parameters.graph
  const visited: {[id: string]: boolean} = {}
  const toCheck = [graph.sinkNode]
  const sourceNode = graph.sourceNode
  while (toCheck.length) {
    const next = toCheck.shift()!
    if (!visited[next]) {
      visited[next] = true
      if (graph.nodes[next].id === id) return graph.nodes[next]
      const nextEdges = graph.edges[next]
      toCheck.push(...nextEdges)
    }
  }
  return null
}

export function selectSubGraph(wfId: string, runId?: string) {
  return (dispatch, getState: getState) => {
    const state = getState().app
    const selectedDomain = state.selectedDomain
    if (!selectedDomain) return dispatch(fetchWorkflowsFailed('no domain selected'))
    if (runId) {
      state.api.getWorkflow({workflowId: wfId, runId: runId}, selectedDomain, (err, data) => {
        if (err) return dispatch(fetchWorkflowsFailed(err.message))
        dispatch(buildGraph(data!.wfInput.input))
      })
    } else {
      const loadedWorkflow = state.loadedWorkflow
      if (!loadedWorkflow) return dispatch(fetchWorkflowsFailed('no workflow loaded'))
      const graph = findInGraph(loadedWorkflow.wfInput.input as TaskGraphGraphNode, wfId)
      if (!graph) return dispatch(fetchWorkflowsFailed('could not find selected graph'))
      dispatch(buildGraph(graph))
    }
  }
}
