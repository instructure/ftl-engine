import { EventEmitter } from 'events'
import { Logger as BunyanLogger, createLogger, Stream, LoggerOptions} from 'bunyan'
import { Task } from 'simple-swf/build/src/tasks'
import * as _ from 'lodash'
export type LogLevels = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

function buildDevOpts(level?: LogLevels): Stream[] | null {
  try {
    let PrettyStream = require('bunyan-prettystream')
    let stream = new PrettyStream()
    stream.pipe(process.stdout)
    return [
      {
        level: level || 'info',
        type: 'raw',
        stream: stream
      }
    ]
  } catch (e) {
    console.warn('unable to load prettystream')
    return null
  }
}
export interface LoggerOpts {
  name: string,
  devMode?: boolean,
  level?: LogLevels
}
export class Logger extends EventEmitter {
  logger: BunyanLogger

  constructor(loggerOpts: LoggerOpts ) {
    super()
    const {name, devMode} = loggerOpts
    if (devMode) {
      let streams = buildDevOpts(loggerOpts.level)
      let opts: LoggerOptions = {name}
      if (streams) {
        opts.streams = streams
      }
      this.logger = createLogger(opts)
    } else {
      this.logger = createLogger({name})
    }
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
  fatal(msg: string, meta?: Object) {
    this.log('fatal', msg, meta)
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
    let allMeta = _.defaults(metaOverrides || {}, baseMeta)
    this.logger[level](msg, allMeta)
  }
}
