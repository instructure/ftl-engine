import * as _ from 'lodash'

import { ActivityWorker as SWFActivityWorker } from 'simple-swf/build/src/workers'
import { ActivityTask } from 'simple-swf/build/src/tasks'
import { Activity, Workflow } from 'simple-swf/build/src/entities'
import { ConfigOverride } from 'simple-swf/build/src/SWFConfig'
import { TaskStatus, StopReasons } from 'simple-swf/build/src/interfaces'

import { Config } from '../Config'
import { Logger, LogWorkerMixin, LogLevels } from '../lib/Logger'
import { applyMixins } from '../util'

export class ActivityWorker extends SWFActivityWorker implements LogWorkerMixin {
  ftlConfig: Config
  workerName: string
  logger: Logger
  activityTimers: {[id: string]: Date}
  constructor(workflow: Workflow, config: Config, opts: ConfigOverride) {
    super(workflow, opts)
    this.ftlConfig = config
    this.workerName = 'activityWorker'
    this.logger = config.logger
    this.on('startTask', this.onStartTask.bind(this))
    this.on('finished', this.onFinishedTask.bind(this))
    this.on('warn', this.onWarn.bind(this))
    this.on('poll', this.onPoll.bind(this))
    this.activityTimers = {}
  }

  start(cb) {
    super.start((err, registeredActivities) => {
      if (err) return cb(err)
      registeredActivities = registeredActivities || []
      registeredActivities.forEach((actCreated) => {
        this.logInfo(`activity ${actCreated.activity.name} ${actCreated.created ? 'was created' : 'already exists'}`)
      })
      this.logInfo('started activity worker')
      cb()
    })
  }
  stop(cb: {(err?: Error)}) {
    const curActivityNames = Object.keys(this.activeActivities)
    let cbCalled = false

    let waitTimeout = setTimeout(() => {
      if (cbCalled) return
      cbCalled = true
      cb(new Error('running activities did not stop in time, some activities may have left invalid state'))
    }, 1000 * 30)
    this.logInfo(`requesting ${curActivityNames.length} stop, will wait 30 seconds`, {running: curActivityNames})
    super.stop((err) => {
      if (cbCalled) return
      cbCalled = true
      clearTimeout(waitTimeout)
      if (!err) this.logInfo('successfully stopped activitiy worker')
      cb(err)
    })

  }
  onStartTask(task: ActivityTask, execution: Activity) {
    this.activityTimers[task.id] = new Date()
    this.ftlConfig.metricReporter.increment('activity.running')
    this.ftlConfig.metricReporter.increment(`activity.byHandler.${task.activityName()}.running`)
    const taskInfo = {task: {type: task.activityName(), id: execution.id}}
    this.logInfo('received activity task', taskInfo)
    execution.on('completed', this.onTaskCompleted.bind(this, task, execution))
    execution.on('failed', this.onTaskFailed.bind(this, task, execution))
    execution.on('canceled', this.onTaskCanceled.bind(this, task, execution))
    execution.on('error', this.onTaskError.bind(this, task, execution))
    execution.on('heartbeat', this.onTaskHeartbeat.bind(this, task, execution))
    execution.on('heartbeatComplete', this.onTaskHBComplete.bind(this, task, execution))
    this.ftlConfig.notifier.sendInfo('taskStarted', {
      task: taskInfo.task,
      workflow: task.getWorkflowInfo(),
      originWorkflow: task.getOriginWorkflow()
    })
  }
  onFinishedTask(task: ActivityTask, execution: Activity, success: boolean, details: TaskStatus) {
    let startTime = this.activityTimers[task.id]
    const taskInfo = {type: task.activityName(), id: execution.id}
    this.ftlConfig.metricReporter.timing('activity.timer', startTime)
    this.ftlConfig.metricReporter.timing(`activity.byHandler.${task.activityName()}.timer`, startTime)
    this.ftlConfig.metricReporter.decrement('activity.running')
    this.ftlConfig.metricReporter.decrement(`activity.byHandler.${task.activityName()}.running`)
    delete this.activityTimers[task.id]
    this.logInfo('responded to activity task', { task: taskInfo, success: success })
    this.logDebug('finished task details', { task: taskInfo, success: success, details: details })
    this.emit('activityCompleted', task, execution, details)
  }
  onWarn(err: Error) {
    this.logWarn('received non-critical error, continuing', { err })
  }
  onPoll() {
    this.ftlConfig.metricReporter.increment('activity.pollCompleted')
    this.logInfo('polling for tasks...')
  }
  onTaskCompleted(task: ActivityTask, execution: Activity, details: TaskStatus) {
    const taskInfo = {type: task.activityName(), id: execution.id}
    this.ftlConfig.metricReporter.increment('activity.completed')
    this.ftlConfig.metricReporter.increment(`activity.byHandler.${task.activityName()}.completed`)
    this.ftlConfig.notifier.sendInfo('taskFinished', {
      task: taskInfo,
      workflow: task.getWorkflowInfo(),
      originWorkflow: task.getOriginWorkflow(),
      details
    })
    this.logInfo('task completed', this.buildTaskMeta(task, { details: details }))
  }
  onTaskFailed(task: ActivityTask, execution: Activity, err: Error, details: TaskStatus) {
    const taskInfo = {type: task.activityName(), id: execution.id}
    this.ftlConfig.metricReporter.increment('activity.failed')
    this.ftlConfig.metricReporter.increment(`activity.byHandler.${task.activityName()}.failed`)
    this.ftlConfig.notifier.sendWarn('taskFailed', {
      task: taskInfo,
      workflow: task.getWorkflowInfo(),
      originWorkflow: task.getOriginWorkflow(),
      details,
      err
    })
    this.logInfo('task failed', this.buildTaskMeta(task, { err, details: details }))
  }
  onTaskCanceled(task: ActivityTask, execution: Activity, reason: StopReasons) {
    const taskInfo = {type: task.activityName(), id: execution.id}
    this.ftlConfig.metricReporter.increment('activity.canceled')
    this.ftlConfig.metricReporter.increment(`activity.byHandler.${task.activityName()}.canceled`)
    delete this.activityTimers[task.id]
    this.ftlConfig.notifier.sendWarn('taskCanceled', {
      task: taskInfo,
      workflow: task.getWorkflowInfo(),
      originWorkflow: task.getOriginWorkflow(),
      reason: reason
    })
    this.logInfo('task canceled', this.buildTaskMeta(task, { reason: reason }))
  }
  onTaskError(task: ActivityTask, execution: Activity, err: Error) {
    const taskInfo = {type: task.activityName(), id: execution.id}
    this.logInfo('unexpected task error', this.buildTaskMeta(task, { err }))
    this.ftlConfig.notifier.sendError('taskError', {
      task: taskInfo,
      workflow: task.getWorkflowInfo(),
      originWorkflow: task.getOriginWorkflow(),
      err
    })
    this.emit('error', err, execution)
  }
  onTaskHeartbeat(task: ActivityTask, execution: Activity, status: TaskStatus) {
    const taskInfo = {type: task.activityName(), id: execution.id}
    this.ftlConfig.notifier.sendInfo('taskHeartbeat', {
      task: taskInfo,
      workflow: task.getWorkflowInfo(),
      originWorkflow: task.getOriginWorkflow(),
      status
    })
    this.logInfo('task heartbeat status', this.buildTaskMeta(task, { status: status }))
  }
  onTaskHBComplete(task: ActivityTask, execution: Activity) {
    this.logDebug('task heartbeat finished', this.buildTaskMeta(task))
  }
  buildTaskMeta(task: ActivityTask, meta?: Object): Object {
    let taskMeta = {
      task: { type: task.activityName(), id: task.id },
      workflow: task.getWorkflowInfo()
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

applyMixins(ActivityWorker, [LogWorkerMixin])
