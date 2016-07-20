import { SWF } from 'aws-sdk'
import * as _ from 'lodash'

import { DeciderWorker as SWFDeciderWorker } from 'simple-swf/build/src/workers'
import { Decider } from 'simple-swf/build/src/entities'
import { ConfigOverride } from 'simple-swf/build/src/SWFConfig'
import { DecisionTask } from 'simple-swf/build/src/tasks'

import { Logger, LogWorkerMixin, LogLevels } from '../lib/Logger'
import { Config } from '../Config'
import { applyMixins } from '../util'

export interface WorkflowWithParent extends SWF.WorkflowExecution {
  parentWorkflowId: string
}

export class DeciderWorker extends SWFDeciderWorker implements LogWorkerMixin{
  ftlConfig: Config
  workerName: string
  logger: Logger
  constructor(decider: Decider, config: Config, opts: ConfigOverride) {
    super(decider, opts)
    this.ftlConfig = config
    this.workerName = 'deciderWorker'
    this.logger = config.logger
    this.on('decision', this.onDecision.bind(this))
    this.on('madeDecision', this.onDecisionMade.bind(this))
    this.on('poll', this.onPoll.bind(this))
  }
  onDecision(task: DecisionTask) {
    this.logInfo('received decision task', this.buildTaskMeta(task))
    this.logDebug('decision task', this.buildTaskMeta(task, { rawTask: task.rawTask }))

  }
  onDecisionMade(task: DecisionTask) {
    this.logInfo('responded to decision task', this.buildTaskMeta(task, { results: task.getDecisionInfo() }))
    this.emit('decisionCompleted', task.decisions.map(function (d) { return d.decision; }))
  }
  onPoll() {
    this.logInfo('polling for tasks...')
  }
  start(cb) {
    super.start((err) => {
      if (err) return cb(err)
      this.logInfo("stated decider worker")
      cb()
    })
  }
  buildTaskMeta(task: DecisionTask, meta?: Object): Object {
    let wfMeta = task.getWorkflowInfo() as WorkflowWithParent
    let parentWf = task.getParentWorkflowInfo()
    if (parentWf) {
      wfMeta.parentWorkflowId = parentWf.workflowId
    }
    let taskMeta = {
      task: { type: 'taskGraph', id: task.id },
      workflow: wfMeta
    }
    return _.defaults(meta || {}, meta || {})
  }
  // LogWorkerMixin
  identity: string
  logDebug: (msg: string, meta?: Object) => void
  logInfo: (msg: string, meta?: Object) => void
  logWarn: (msg: string, meta?: Object) => void
  logError: (msg: string, err: Error, meta?: Object) => void
  logMeta: (level: LogLevels, msg: string, metaOverrides?: Object) => void
}
