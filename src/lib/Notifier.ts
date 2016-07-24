import { EventEmitter } from 'events'
import { SNS } from 'aws-sdk'

import { Config } from '../Config'
import { LogLevels } from './Logger'


export interface Notifier extends EventEmitter {
  sendInfo(summary: string, event: Object, cb?: {(err?: Error)}): any
  sendWarn(summary: string, event: Object, cb?: {(err?: Error)}): any
  sendError(summary: string, event: Object, cb?: {(err?: Error)}): any
}
export interface SNSNotiferConfig {
  snsTopicName: string
  region: string
  awsAccountId: string
  silenceNotifier: boolean
  snsClient: SNS | null
}


export class SNSNotifier extends EventEmitter implements Notifier {

  config: SNSNotiferConfig
  snsClient: SNS
  mainConfig: Config
  constructor(config: SNSNotiferConfig, mainConfig: Config) {
    super()
    this.config = config
    this.mainConfig = mainConfig
    this.snsClient = config.snsClient || new SNS({ region: this.config.region })
  }
  sendInfo(summary: string, event: Object, cb?: {(err?: Error, resp?: SNS.PublishResponse)}) {
    this.sendLevel('info', summary, event, cb)
  }
  sendWarn(summary: string, event: Object, cb?: {(err?: Error, resp?: SNS.PublishResponse)}) {
    this.sendLevel('warn', summary, event, cb)
  }
  sendError(summary: string, event: Object, cb?: {(err?: Error, resp?: SNS.PublishResponse)}) {
    this.sendLevel('error', summary, event, cb)
  }
  getArn(): string {
    return `arn:aws:sns:${this.config.region}:${this.config.awsAccountId}:${this.config.snsTopicName}`
  }
  sendLevel(level: LogLevels, summary: string, event: any, cb?: {(err?: Error, resp?: SNS.PublishResponse)}) {
    let params = {
      TopicArn: this.getArn(),
      Message: this.buildMessage(level, event, summary),
      Subject: level + ' - ' + summary
    }
    if (this.config.silenceNotifier) return
    cb = cb || ((err?: Error, resp?: SNS.PublishResponse) => {
      if (err) return this.emit('error', err)
      this.emit('response', resp)
    })
    this.snsClient.publish(params, cb)

  }
  buildMessage(level: LogLevels, summary: string, event: any): string {
    let msg = JSON.stringify({
      domain: this.mainConfig.domainName,
      level: level,
      summary: summary,
      event: event
    })
    return msg
  }
}
