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

export class DeciderWorker extends SWFDeciderWorker implements LogWorkerMixin {
  ftlConfig: Config
  workerName: string
  logger: Logger
  decisionTimers: {[id: string]: Date}
  constructor(decider: Decider, config: Config, opts: ConfigOverride) {
    super(decider, opts)
    this.ftlConfig = config
    this.workerName = 'deciderWorker'
    this.logger = config.logger
    this.on('decision', this.onDecision.bind(this))
    this.on('madeDecision', this.onDecisionMade.bind(this))
    this.on('poll', this.onPoll.bind(this))
    this.decisionTimers = {}
  }
  onDecision(task: DecisionTask) {
    this.decisionTimers[task.id] = new Date()
    this.ftlConfig.metricReporter.increment('decider.running')
    this.logInfo('received decision task', this.buildTaskMeta(task))
    this.logDebug('decision task', this.buildTaskMeta(task, { rawTask: task.rawTask }))
  }
  onDecisionMade(task: DecisionTask) {
    const finishTime = this.decisionTimers[task.id]
    delete this.decisionTimers[task.id]
    this.ftlConfig.metricReporter.decrement('decider.running')
    this.ftlConfig.metricReporter.increment('decider.completed')
    this.ftlConfig.metricReporter.timing('decider.timer', finishTime)
    this.logInfo('responded to decision task', this.buildTaskMeta(task, { results: task.getDecisionInfo() }))
    const failedWorkflows = task.decisions.filter((d) => d.decision.decisionType === 'FailWorkflowExecution')
    // there should only really be one failedWorkflow
    if (failedWorkflows.length) {
      const wf = failedWorkflows[0]
      this.ftlConfig.notifier.sendError('workflowFailed', {
        workflow: task.getWorkflowInfo(),
        control: task.getWorkflowTaskInput().control,
        parentWf: task.getParentWorkflowInfo(),
        originWorkflow: task.getOriginWorkflow(),
        details: wf.decision.failWorkflowExecutionDecisionAttributes!.details,
        reason: wf.decision.failWorkflowExecutionDecisionAttributes!.reason
      })
    }
    this.emit('decisionCompleted', task.decisions.map((d) => d.decision ))
  }
  onPoll() {
    this.ftlConfig.metricReporter.increment('decider.pollCompleted')
    this.logInfo('polling for tasks...')
  }
  start(cb) {
    super.start((err) => {
      if (err) return cb(err)
      this.logInfo('stated decider worker')
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
    return _.defaults(taskMeta || {}, meta || {})
  }
  // LogWorkerMixin
  identity: string
  logDebug: (msg: string, meta?: Object) => void
  logInfo: (msg: string, meta?: Object) => void
  logWarn: (msg: string, meta?: Object) => void
  logError: (msg: string, err: Error, meta?: Object) => void
  logMeta: (level: LogLevels, msg: string, metaOverrides?: Object) => void
}

applyMixins(DeciderWorker, [LogWorkerMixin])
