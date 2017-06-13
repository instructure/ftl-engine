import { EventEmitter } from 'events'
import * as Raven from 'raven'

import { Notifier } from './Notifier'
import { LogLevels } from './Logger'
import { Config } from '../Config'

export interface SentryNotifierConfig {
  dsn: string,
  ravenClient?: Raven.Client,
  silenceNotifier: boolean,
  ravenOpts: {
    tags?: {[tag: string]: string},
    name?: string,
    logger?: string,
    release?: string,
    environment?: string
  }
}

export class SentryNotifier extends EventEmitter implements Notifier {
  config: SentryNotifierConfig
  raven: Raven.Client
  mainConfig: Config
  constructor(config: SentryNotifierConfig, mainConfig: Config) {
    super()
    this.config = config
    this.mainConfig = mainConfig
    this.raven = config.ravenClient || Raven.config(config.dsn, config.ravenOpts).install()
  }
  sendInfo(summary: string, event: Object, cb?: {(err?: Error, eventId?: string)}) {
    this.sendLevel('info', summary, event, cb)
  }
  sendWarn(summary: string, event: Object, cb?: {(err?: Error, eventId?: string)}) {
    this.sendLevel('warn', summary, event, cb)
  }
  sendError(summary: string, event: Object, cb?: {(err?: Error, eventId?: string)}) {
    this.sendLevel('error', summary, event, cb)
  }
  sendLevel(level: LogLevels, summary: string, event: any, cb?: {(err?: any, eventId?: string)}) {
    if (this.config.silenceNotifier) return
    const rOpts = {
      tags: {
        domain: this.mainConfig.domainName,
        workflowName: this.mainConfig.workflowName
      },
      release: this.mainConfig.defaultVersion,
      level: level,
      extra: event
    }
    cb = cb || ((err?: any, eventId?: string) => {
      if (err) return this.emit('error', err)
      this.emit('response', {eventId})
    })
    if (event && event.err && event.err instanceof Error) {
      this.raven.captureException(event.err, rOpts, cb)
    } else {
      this.raven.captureMessage(summary, rOpts, cb)
    }
  }
}
