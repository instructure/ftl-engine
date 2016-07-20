import { Logger as BunyanLogger } from 'bunyan'
import { Task } from 'simple-swf/build/src/tasks'
export type LogLevels = 'debug' | 'info' | 'warn' | 'error'

export class Logger {
  logger: BunyanLogger

  constructor(name: string) {
    this.logger = new BunyanLogger({ name: name })
  }
  debug(msg, meta) {
    this.logger.debug(meta, msg)
  }
  info(msg, meta) {
    this.logger.info(meta, msg)
  }
  warn(msg, meta) {
    this.logger.warn(meta, msg)
  }
  error(msg, meta) {
    this.logger.error(meta, msg)
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
    this.logger[level](_.defaults(metaOverrides || {}, baseMeta), msg)
  }
}
