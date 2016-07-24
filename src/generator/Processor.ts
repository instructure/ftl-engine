import * as path from 'path'
import * as fs from 'fs'

import * as async from 'async'
import * as shortId from 'shortid'
import * as _ from 'lodash'


import { TaskGraphNode } from '../deciders/TaskGraph'
import { Task, ITaskBuilder } from './interfaces'
import { TaskGraphBuilder, TaskGraphNodeDeps } from './TaskGraphBuilder'
import { MetadataStore } from './MetadataStore'
import { genUtil } from './util'

// allow for overriding of some behavior via json
const OPT_FILE_NAME = 'opts.json'
// default to retring a full workflow only once!
const GRAPH_MAX_RETRY = 1

interface ProcessorOpts {
  maxRetry?: number
}
export interface ExpandedArgs {
  groupName: string,
  expandKey: string,
  items: any[]
}
export interface IProcessor {
  process(args: any, cb: {(err: null | Error, tg: TaskGraphNode | null)})
  expandArgs?: {(args: any, state: MetadataStore): ExpandedArgs}
}

export class Processor implements IProcessor {
  store: MetadataStore
  private currentDir: string
  private files: string[]
  private dirs: string[]
  private opts: ProcessorOpts
  expandArgs?: {(args: any, state: MetadataStore): ExpandedArgs}
  constructor(store: MetadataStore, currentDir: string, files: string[], dirs: string[]) {
    this.store = store
    this.currentDir = currentDir
    this.files = files
    this.dirs = dirs
    this.opts = this.loadOpts()
  }
  private loadOpts(): ProcessorOpts {
    try {
      return this.requireLocal(path.join(this.currentDir, OPT_FILE_NAME)) as ProcessorOpts
    } catch (e) {
      return {}
    }
  }
  process(args: any, cb: {(err: null | Error, tg: TaskGraphNode | null)}) {
    if (typeof args === 'function') {
      cb = args
      args = {}
    }
    this.processForEach(args, cb)
  }
  processForEach(args: any, cb) {
    if (this.expandArgs && typeof this.expandArgs === 'function') {
      var expandInfo = this.expandArgs(args, this.store.getState())
      var graphName = expandInfo.groupName || expandInfo.expandKey
      async.map<any, TaskGraphNode>(expandInfo.items, (item, acb) => {
        var newArgs = _.clone(args)
        newArgs[expandInfo.expandKey] = item
        this.processAllWithArgs(newArgs, this.files, this.dirs, acb)
      }, (err, graphs) => {
        graphs = _.compact(graphs)
        if (!graphs || graphs.length === 0) return cb()
        cb(null, this.createTaskGraph(this.buildGraphName(args, graphName), args, graphs))
      })
    } else {
      this.processAllWithArgs(args, this.files, this.dirs, cb)
    }
  }

  processAllWithArgs(args: any, files: string[], dirs: string[], cb: {(err: Error | null, tg: TaskGraphNode | null)}) {
    this.processFiles(args, files, (err, taskGraph) => {
      if (err) return cb(err, null)
      if (!dirs || dirs.length === 0) return cb(null, taskGraph)

      async.mapSeries<string, TaskGraphNodeDeps>(dirs, this.processDir.bind(this, args), (err, childGraphs) => {
        if (err) return cb(err, null)
        childGraphs = _.compact<TaskGraphNodeDeps>(childGraphs)

        // make child graphs processin order
        childGraphs = this.serializeDeps(childGraphs)
        let graphs = childGraphs
        if (taskGraph && childGraphs.length) {
          childGraphs[0].deps = [taskGraph.name]
          graphs = [taskGraph].concat(childGraphs)
        } else if (taskGraph) {
          graphs = [taskGraph]
        }
        cb(null, this.createTaskGraph(this.buildGraphName(args, `all_in_${path.basename(this.currentDir)}`), args, graphs))
      })
    })
  }
  serializeDeps(tasks: TaskGraphNodeDeps[]): TaskGraphNodeDeps[] {
    for (var i = 1; i < tasks.length; i++) {
      tasks[i].deps = [tasks[i - 1].name]
    }
    return tasks
  }
  processFiles(args, files, cb) {
    async.map(files, this.processFile.bind(this, args), (err, tasks) => {
      if (err) return cb(err)
      tasks = _.compact(tasks)
      if (tasks.length === 0) {
        return cb()
      }

      cb(null, this.createTaskGraph(this.buildGraphName(args, `files_in_${path.basename(this.currentDir)}`), args, tasks))
    })
  }
  createTaskGraph(name: string, args: any, tasks): TaskGraphNode {
    return new TaskGraphBuilder(name, args, tasks, this).getGraph()
  }
  buildGraphName(args: any, prefix: string | null): string {
    prefix = prefix || this.currentDir.split(path.sep).join('_')

    if (Object.keys(args).length) {
      return `${prefix}_args_${genUtil.serializeArgs(args)}`
    } else {
      return `${prefix}_${shortId.generate()}`
    }
  }
  processDir(args: any, dir: string, cb: {(err: Error | null, tgs: TaskGraphNode | null)}) {
    genUtil.readDirectory(path.join(this.currentDir, dir), (err, dirInfo) => {
      if (err) return cb(err, null)
      if (!dirInfo) return cb(null, null)

      let ProcClass = Processor
      const newDir = path.join(this.currentDir, dir)
      if (dirInfo.hasIndex) {
        ProcClass = this.requireLocal(newDir)(Processor)
      }
      const processor = new ProcClass(this.store, newDir, dirInfo.files, dirInfo.dirs)
      // clone args before passing into new processor so we don't step on each other
      processor.process(_.clone(args), cb)
    })
  }
  buildId(args: any, name: string) {
    return `${name}_${shortId.generate()}`
  }
  requireLocal(classPath: string): any {
    let newMod: any = null
    if (path.isAbsolute(classPath)) {
      newMod = require(classPath)
    } else {
      newMod = require('./' + classPath)
    }
    if (newMod.default) {
      return newMod.default
    } else {
      return newMod
    }
  }
  processFile(args: any, file: string, cb: {(err: Error | null, node: TaskGraphNode | null)}) {
    const taskBuilder = this.requireLocal(path.join(this.currentDir, file)) as ITaskBuilder
    this.store.updateState(taskBuilder, (err) => {
      if (err) return cb(err, null)
      if (!taskBuilder.create) return cb(null, null)
      const syncLength = 2 // we always pass state
      const asyncLength = 3 // assume this means calling asnyc
      let funArgs = [args, this.store.getState()]
      if (taskBuilder.create.length === syncLength) {
        try {
          let taskDef = taskBuilder.create.apply(taskBuilder, funArgs) as Task
          if (!taskDef) return process.nextTick(() => cb(null, null))
          const task = this.wrapTask(args, file, taskDef, taskBuilder)
          return process.nextTick(() => cb(null, task))
        } catch (e) {
          throw e
        }
      } else {
        funArgs.push((err: Error | null, taskDef: Task | null) => {
          if (err) return cb(err, null)
          if (!taskDef) return cb(null, null)
          cb(null, this.wrapTask(args, file, taskDef, taskBuilder))
        })
        taskBuilder.create.apply(taskBuilder, funArgs)
      }
    })
  }
  wrapTask(args: any, file: string, taskDef: Task, taskBuilder: ITaskBuilder): TaskGraphNode {
    var name = path.basename(file, path.extname(file))
    const newNode = _.clone(taskDef) as TaskGraphNodeDeps
    newNode.id = this.buildId(args, name)
    newNode.type = 'activity'
    newNode.name = name
    newNode.deps = taskBuilder.dependsOn || []
    newNode.sourceFile = file
    newNode.sourceDir = this.getCurrentDir()
    return newNode
  }
  getCurrentDir(): string {
    return path.relative(process.cwd(), this.currentDir)
  }
  getMaxRetry(): number {
    return this.opts.maxRetry || GRAPH_MAX_RETRY
  }
}
