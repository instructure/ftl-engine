import { Logger as BunyanLogger, createLogger} from 'bunyan'
import { Task } from 'simple-swf/build/src/tasks'
import * as _ from 'lodash'
export type LogLevels = 'debug' | 'info' | 'warn' | 'error'

export class Logger {
  logger: BunyanLogger

  constructor(name: string) {
    this.logger = createLogger({name})
  }
  debug(msg: string, meta?: Object) {
    this.log('debug', msg, meta)
  }
  info(msg: string, meta?: Object) {
    this.log('info', msg, meta)
  }
  warn(msg: string, meta?: Object) {
    this.log('warn', msg, meta)
  }
  error(msg: string, meta?: Object) {
    this.log('error', msg, meta)
  }
  log(level: LogLevels, msg: string, meta?: Object) {
    if (meta) {
      this.logger[level](meta, msg)
    } else {
      this.logger[level](msg)
    }
  }
}

export class LogWorkerMixin {
  workerName: string
  identity: string
  logger: Logger
  buildTaskMeta(task: any, meta?: Object) {
    throw new Error('must override!')
  }
  logDebug(msg: string, meta?: Object) {
    this.logMeta('debug', msg, meta)
  }
  logInfo(msg: string, meta?: Object) {
    this.logMeta('info', msg, meta)
  }
  logWarn(msg: string, meta?: Object) {
    this.logMeta('warn', msg, meta)
  }
  logError(msg: string, err: Error, meta?: Object) {
    this.logMeta('error', msg, { error: err })
  }
  logMeta(level: LogLevels, msg: string, metaOverrides?: Object) {
    let baseMeta = {
      from: this.workerName,
      identity: this.identity,
    }
    this.logger[level](msg, _.defaults(metaOverrides || {}, baseMeta))
  }
}
