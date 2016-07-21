import { genUtil } from './util'
import * as _ from 'lodash'
import { Processor } from './Processor'
import { TaskGraphNode, TaskGraphGraph, TaskGraphGraphNode, TaskGraphMarkerNode } from '../deciders/TaskGraph'

export interface TaskGraphNodeDeps extends TaskGraphNode {
  deps: string[]
}

export class TaskGraphBuilder {
  name: string
  id: string
  processor: Processor
  graph: TaskGraphGraph
  sourceTask: TaskGraphMarkerNode
  sinkTask: TaskGraphMarkerNode
  byName: {[nodeName: string]: TaskGraphNode}
  constructor(name: string, args: any, tasks: TaskGraphNode[], processor: Processor) {
    this.name = name
    this.id = processor.buildId(args, name)
    this.processor = processor
    this.graph = {nodes: {}, edges: {}, revEdges: {}, sourceNode: '', sinkNode: ''}
    this.sourceTask = this.createCheckTask(args, tasks, 'sourceTask', 'Starting')
    this.sinkTask = this.createCheckTask(args, tasks, 'sinkTask', 'Finished')
    this.byName = _.keyBy<TaskGraphNode>(tasks, 'name')
    this.graph = tasks.reduce(this.reduceToGraph.bind(this), this.graph)
    this.addSinkNodeEdges()
    this.addSourceSinkNodes()
  }
  createCheckTask(args, tasks, name, label): TaskGraphMarkerNode {
    return {
      sourceDir: this.processor.getCurrentDir(),
      name: name,
      sourceFile: name,
      id: this.processor.buildId(args, name),
      type: 'decision',
      handler: 'recordMarker',
      parameters: {
        status: `${label} tasks in ${this.processor.getCurrentDir()}, ${tasks.length} total tasks, args: ${genUtil.serializeArgs(args)}`
      }
    }
  }
  getGraph(): TaskGraphGraphNode {
    // get rid of rev edges
    delete this.graph.revEdges
    return {
      type: 'decision',
      handler: 'taskGraph',
      id: this.id,
      name: this.name,
      sourceFile: this.name,
      sourceDir: this.processor.getCurrentDir(),
      maxRetry: this.processor.getMaxRetry(),
      parameters: {
        graph: this.graph
      }
    }
  }
  addSinkNodeEdges() {
    // find nodes with no deps and attack to sink
    let sinkEdges: string[] = []
    if (!this.graph.revEdges) throw new Error('unexpected, revEdges not computed')
    for(let taskId in this.graph.revEdges) {
      if (this.graph.revEdges[taskId].length === 0) {
        this.graph.revEdges[taskId] = [this.sinkTask.id]
        sinkEdges.push(taskId)
      }
    }
    this.graph.edges[this.sinkTask.id] = sinkEdges
  }
  addSourceSinkNodes() {
    this.graph.nodes[this.sourceTask.id] = this.sourceTask
    this.graph.nodes[this.sinkTask.id] = this.sinkTask
    this.graph.sourceNode = this.sourceTask.id
    this.graph.sinkNode = this.sinkTask.id
  }
  reduceToGraph(graph: TaskGraphGraph, task: TaskGraphNodeDeps) {
    if (Object.keys(task).length === 0) {
      throw new Error('empty task passed. not cool')
    }
    // build up the graph with edges both direction for convience for now...
    // TODO: figure out which way it makes more sense to have edges...

    // convert named deps to ids to get uniqueness
    task.deps = task.deps || []
    var idDeps = task.deps.map((dep) => {
      if (!this.byName[dep]) throw new Error(`cannot find task with name ${dep} in ${task.name}`)
      return this.byName[dep].id
    })

    // connect all nodes with no deps to source node
    if (idDeps.length === 0) {
      idDeps.push(this.sourceTask.id)
    }

    // compute reverse edges
    if (!graph.revEdges) throw new Error('unexpected case, graph.revEdges null')
    graph.revEdges[task.id] = graph.revEdges[task.id] || []
    idDeps.forEach((idDep) => {
      graph.revEdges![idDep] = graph.revEdges![idDep] || []
      graph.revEdges![idDep].push(task.id)
    })
    delete task.deps

    // atttach to graph
    graph.edges[task.id] = idDeps
    graph.nodes[task.id] = task
    return graph
  }
}
