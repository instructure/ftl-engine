import { Workflow } from 'simple-swf/build/src/entities'
import { ConfigOverride } from 'simple-swf/build/src/SWFConfig'
import { DecisionTask, EventData } from 'simple-swf/build/src/tasks'
import * as _ from 'lodash'

import { BaseDecider } from '../entities'
import { Config } from '../Config'

export interface TaskGraphNode {
  type: 'decision' | 'activity'
  handler: string
  id: string
  name: string
  sourceFile: string
  sourceDir: string
  parameters: any
  maxRetry?: number
}

export interface TaskGraphActivityNode extends TaskGraphNode {
  opts?: {
    taskList?: string,
    taskPriority?: number,
    scheduleToCloseTimeout?: number,
    scheduleToStartTimeout?: number
    startToCloseTimeout?: number
  }
}

export interface TaskGraphGraph {
  nodes: {
    [name: string]: TaskGraphNode
  }
  edges: {
    [name: string]: string[]
  }
  revEdges?: {
    [name: string]: string[]
  }
  sourceNode: string
  sinkNode: string
}

export interface TaskGraphParameters {
  graph: TaskGraphGraph
}
export interface TaskGraphGraphNode extends TaskGraphNode {
  parameters: TaskGraphParameters,
}
export interface TaskGraphMarkerNode extends TaskGraphNode {
  parameters: {
    status: string
  }
}
export type AllNodeTypes = TaskGraphNode | TaskGraphGraphNode | TaskGraphMarkerNode
function isTaskGraphGraphNode(node: AllNodeTypes): node is TaskGraphGraphNode {
  return node.type === 'decision' && node.handler === 'taskGraph'
}
function isTaskGraphMarkerNode(node: AllNodeTypes): node is TaskGraphMarkerNode {
  return node.type === 'decision' && node.handler === 'recordMarker'
}
export interface NodeDetails {
  id: string,
  node: TaskGraphNode,
  type: string,
  deps: string[],
  state: string
}

export default class TaskGraph extends BaseDecider {
  maxRunningWorkflow: number
  constructor(config: Config, workflow: Workflow) {
    super(config, workflow)
    this.maxRunningWorkflow = config.getOpt('maxRunningWorkflow') as number
    if (!this.maxRunningWorkflow) throw new Error('missing maxRunningWorkflow')
  }
  makeDecisions(task: DecisionTask, cb: {(Error?)}): any {
    const input = task.getWorkflowInput()
    if (input.handler !== 'taskGraph') return cb(new Error('invalid handler for taskGrah'))
    const parameters = input.parameters
    this.decide(parameters, task)
    cb()
  }
  decide(parameters: TaskGraphParameters, decisionTask: DecisionTask) {
    const graph = parameters.graph
    const groupedEvents = decisionTask.getGroupedEvents()
    let next = this.getNextNodes(graph, groupedEvents)
    let startCountByHandler = {}
    let startCountSubWorkflows = 0
    for (let node of next.nodes) {
      if (node.type === 'decision') {
        // TODO: somehow hand off to a child? need to make this more generic but just hard code for now...
        if (node.handler === 'taskGraph') {
          let tgNode = node as TaskGraphGraphNode
          const shouldThrottle = this.throttleWorkflows(tgNode, graph, groupedEvents, startCountSubWorkflows)
          if (!shouldThrottle) {
            startCountSubWorkflows++
            const maxRetry = tgNode.maxRetry || this.ftlConfig.getOpt('maxRetry')
            decisionTask.startChildWorkflow(tgNode.id, tgNode, {maxRetry: maxRetry})
          }
        }
        else if (node.handler === 'recordMarker') {
          decisionTask.addMarker(node.id, node.parameters.status)
        }
        else {
          this.logger.warn('couldn\'t find hander for child node', node)
        }
      }
      else {
        const shouldThrottle = this.throttle(node, graph, groupedEvents, startCountByHandler)
        if (!shouldThrottle) {
          startCountByHandler[node.handler] = startCountByHandler[node.handler] || 0
          startCountByHandler[node.handler]++
          const handlerActType = this.activities.getModule(node.handler)
          if (!handlerActType) throw new Error('missing activity type ' + node.handler)
          let opts = this.buildOpts(node)
          opts['maxRetry'] = node.maxRetry || handlerActType.getMaxRetry() || this.ftlConfig.getOpt('maxRetry')
          decisionTask.scheduleTask(node.id, node, handlerActType, opts)
        }
      }
    }
    const failedToReFail = decisionTask.rescheduleFailedEvents()
    const failedToReTimeOut = decisionTask.rescheduleTimedOutEvents()
    const failedToReschedule = failedToReFail.concat(failedToReTimeOut)
    if (failedToReschedule.length > 0) {
      this.logger.warn('failed to reschedule all previously failed events')
      decisionTask.failWorkflow('failed to reschedule previously failed events', JSON.stringify(failedToReschedule).slice(0, 250))
    }
    else if (next.finished) {
      // TODO: better results
      decisionTask.completeWorkflow({status: 'success'})
    }

  }
  buildOpts(node: TaskGraphActivityNode): ConfigOverride {
    if (node.opts) {
      let opts = node.opts as any
      if (opts.taskList) {
        opts.taskList = {
          name: opts.taskList
        }
      }
      return opts as ConfigOverride
    } else {
      return {}
    }
  }
  throttle(
    node: TaskGraphNode,
    graph: TaskGraphGraph,
    groupedEvents: EventData,
    startCountByHandler: {[handler: string]: number}
  ): boolean {
    const handlerActType = this.activities.getModule(node.handler)
    if (!handlerActType) return false
    const maxConcurrent = handlerActType.getMaxConcurrent()
    if (maxConcurrent == null) return false
    if (!groupedEvents.activity) return false
    const startingCount = startCountByHandler[node.handler] || 0
    let curRunningOfType = 0
    for (var nodeId in groupedEvents.activity) {
      const curNode = this.getNodeDetails(graph, groupedEvents, nodeId)
      if (curNode.state === 'started' && curNode.node.handler === node.handler) {
        curRunningOfType++
      }
    }
    if ((curRunningOfType + startingCount) >= maxConcurrent) return true
    return false
  }
  throttleWorkflows(
    node: TaskGraphGraphNode,
    graph: TaskGraphGraph,
    groupedEvents: EventData,
    startCountSubWorkflows: number,
    maxRunningWorkflow?: number
  ): boolean {
    maxRunningWorkflow = maxRunningWorkflow || this.maxRunningWorkflow
    let curRunningWorkflows = 0
    if (!groupedEvents.workflow) return false
    for (let nodeId in groupedEvents.workflow) {
      const curNode = this.getNodeDetails(graph, groupedEvents, nodeId)
      if (curNode.state === 'started') {
        curRunningWorkflows++
      }
    }
    if ((curRunningWorkflows + startCountSubWorkflows) >= maxRunningWorkflow) return true
    return false
  }
  getNodeDetails(graph: TaskGraphGraph, grouped: EventData, name: string): NodeDetails {
    const node = graph.nodes[name]
    let type: string
    let state: string
    if (isTaskGraphGraphNode(node)) {
      type = 'workflow'
      state = (grouped[type] && grouped[type][name]) ? grouped[type][name].current : 'waiting'
    } else if (isTaskGraphMarkerNode(node)) {
      type = 'marker'
      state = (grouped[type] && grouped[type][name]) ? grouped[type][name].current : 'collapse'
    } else {
      type = node.type || 'activity'
      state = (grouped[type] && grouped[type][name]) ? grouped[type][name].current : 'waiting'
    }
    const deps = graph.edges[name] || []
    return { id: node.id, node, type: type, deps: deps, state: state }
  }
  getNextNodes(graph, grouped): {nodes: TaskGraphNode[], finished: boolean} {
    const nodeDetails = this.getNodeDetails.bind(this, graph, grouped)
    let node = nodeDetails(graph.sinkNode)
    if (node.state === 'completed') return { nodes: [], finished: true }
    let haveLastNode = false
    const sources = [graph.sinkNode]
    const nodes: {[nodeId: string]: TaskGraphNode} = {}
    while (sources.length) {
      const next = sources.shift()
      node = nodeDetails(next)
      // if given the collapse state, automatically add
      if (node.state === 'waiting' || node.state === 'collapse') {
        const depNodes = node.deps.map(nodeDetails)
        const notDone = depNodes.filter(function (n) { return n.state !== 'completed' && n.state !== 'collapse' })
        if (notDone.length === 0) {
          if (node.id === graph.sinkNode) {
            haveLastNode = true
          }
          nodes[node.id] = node.node
        }
      }
      sources.push.apply(sources, node.deps)
    }
    return { nodes: _.values<TaskGraphNode>(nodes), finished: haveLastNode }
  }
  static getChildren(parameters: TaskGraphParameters): TaskGraphNode[] {
    return _.values(parameters.graph.nodes) as TaskGraphNode[]
  }
  static validateTask(parameters: any): string | null {
    if (!parameters.graph) return 'missing "graph" field in parameters'
    const graph = parameters.graph
    const required = ['nodes', 'edges', 'sourceNode', 'sinkNode']
    for (let key of required) {
      if (!graph[key]) return 'missing ' + key + ' field in graph'
    }
    return null
  }
  static getHandlerName() {
    return 'taskGraph'
  }
}
