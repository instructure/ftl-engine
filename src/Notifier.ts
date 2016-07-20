import { EventEmitter } from 'events'
import { SNS } from 'aws-sdk'
import { Config } from './Config'
import { LogLevels } from './interfaces'
export interface Notifier {
  sendInfo(event: any, summary: string, cb: OptionalCB): any
  sendWarn(event: any, summary: string, cb: OptionalCB): any
  sendError(event: any, summary: string, cb: OptionalCB): any
}
export interface SNSNotiferConfig {
  snsTopicName: string
  snsRegion: string
  awsAccountId: string
  silenceNotifier: boolean
  snsClient: SNS | null
}

export type OptionalCB = {(err?: Error, resp?: SNS.PublishResponse)} | null

export class SNSNotifier extends EventEmitter implements Notifier {

  config: SNSNotiferConfig
  snsClient: SNS
  mainConfig: Config
  constructor(config: SNSNotiferConfig, mainConfig: Config) {
    super()
    this.config = config
    this.mainConfig = mainConfig
    this.snsClient = config.snsClient || new SNS({ region: this.config.snsRegion })

  }
  sendDebug(event: any, summary: string, cb: OptionalCB) {
    this.sendLevel('debug', event, summary, cb)
  }
  sendInfo(event: any, summary: string, cb: OptionalCB) {
    this.sendLevel('info', event, summary, cb)
  }
  sendWarn(event: any, summary: string, cb: OptionalCB) {
    this.sendLevel('warn', event, summary, cb)
  }
  sendError(event: any, summary: string, cb: OptionalCB) {
    this.sendLevel('error', event, summary, cb)
  }
  getArn(): string {
    return `arn:aws:sns:${this.config.snsRegion}:${this.config.awsAccountId}:${this.config.snsTopicName}`
  }
  sendLevel(level: LogLevels, event: any, summary: string, cb: OptionalCB) {
    let params = {
      TopicArn: this.getArn(),
      Message: this.buildMessage(level, event, summary),
      Subject: level + " - " + summary
    }
    if (this.config.silenceNotifier) return
    cb = cb || function (err?: Error, resp?: SNS.PublishResponse) {
      if (err) return this.emit('error', err)
      this.emit('response', resp)
    }
    this.snsClient.publish(params, cb)

  }
  buildMessage(level: LogLevels, event: any, summary: string): string {
    let msg = JSON.stringify({
      domain: this.mainConfig.domainName,
      level: level,
      summary: summary,
      event: event
    })
    return msg
  }
}
