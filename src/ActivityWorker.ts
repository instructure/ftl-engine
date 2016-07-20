import { ActivityWorker as SWFActivityWorker } from 'simple-swf/src/workers'
import { ActivityTask } from 'simple-swf/src/tasks'
import { Activity, Workflow } from 'simple-swf/src/entities'
import { ConfigOverride } from 'simple-swf/src/SWFConfig'
import { ActivityStatus, StopReasons } from 'simple-swf/src/interfaces'
import { Config } from './Config'
import { Logger, LogWorkerMixin } from './Logger'
import { applyMixins } from './util'
import { LogLevels } from './interfaces'
import * as _ from 'lodash'
class ActivityWorker extends SWFActivityWorker implements LogWorkerMixin {
  ftlConfig: Config
  workerName: string
  logger: Logger
  constructor(workflow: Workflow, config: Config, opts: ConfigOverride) {
    super(workflow, opts)
    this.ftlConfig = config
    this.workerName = 'activityWorker'
    this.logger = config.logger
    this.on('startTask', this.onStartTask.bind(this))
    this.on('finished', this.onFinishedTask.bind(this))
    this.on('warn', this.onWarn.bind(this))
    this.on('poll', this.onPoll.bind(this))
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
  onStartTask(task: ActivityTask, execution: Activity) {
    this.logInfo('received activity task', { task: { type: task.activityName(), id: execution.id } })
    execution.on('completed', this.onTaskCompleted.bind(this, task, execution))
    execution.on('failed', this.onTaskFailed.bind(this, task, execution))
    execution.on('canceled', this.onTaskCanceled.bind(this, task, execution))
    execution.on('error', this.onTaskError.bind(this, task, execution))
    execution.on('heartbeat', this.onTaskHeartbeat.bind(this, task, execution))
    execution.on('heartbeatComplete', this.onTaskHBComplete.bind(this, task, execution))
  }
  onFinishedTask(task: ActivityTask, execution: Activity, success: boolean, details: ActivityStatus) {
    this.logInfo('responded to activity task', { task: { type: task.activityName(), id: execution.id }, success: status })
    this.logDebug('finished task details', { task: { type: task.activityName(), id: execution.id }, success: status, details: details })
    this.emit('activityCompleted', task, execution, details)
  }
  onWarn(err: Error) {
    this.logWarn('received non-critical error, continuing', { error: err })
  }
  onPoll() {
    this.logInfo('polling for tasks...')
  }
  onTaskCompleted(task: ActivityTask, execution: Activity, details: ActivityStatus) {
    this.logInfo('task completed', this.buildTaskMeta(task, { details: details }))
  }
  onTaskFailed(task: ActivityTask, execution: Activity, err: Error, details: ActivityStatus) {
    this.logInfo('task failed', this.buildTaskMeta(task, { error: err, details: details }))
  }
  onTaskCanceled(task: ActivityTask, execution: Activity, reason: StopReasons) {
    this.logInfo('task canceled', this.buildTaskMeta(task, { reason: reason }))
  }
  onTaskError(task: ActivityTask, execution: Activity, err: Error) {
    this.logInfo('unexpected task error', this.buildTaskMeta(task, { error: err }))
    this.emit('error', err, execution)
  }
  onTaskHeartbeat(task: ActivityTask, execution: Activity, status: ActivityStatus) {
    this.logInfo('task heartbeat', this.buildTaskMeta(task, execution))
    this.logDebug('task heartbeat status', this.buildTaskMeta(task, { status: status }))
  }
  onTaskHBComplete(task: ActivityTask, execution: Activity) {
    this.logDebug('task heartbeat finished', this.buildTaskMeta(task))
  }
  buildTaskMeta(task: ActivityTask, meta?: Object): Object {
    let taskMeta = {
      task: { type: task.activityName(), id: task.id },
      workflow: task.getWorkflowInfo()
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
