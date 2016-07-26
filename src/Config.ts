import * as path from 'path'
import * as _ from 'lodash'
import { EventEmitter } from 'events'
import { SWF } from 'aws-sdk'

import { SWFConfig, ConfigOverrides, ConfigOverride } from 'simple-swf/build/src/SWFConfig'
import { Domain } from 'simple-swf/build/src/entities'
import { FieldSerializer, S3ClaimCheck, ClaimCheck } from 'simple-swf/build/src/util'
import { Logger } from './lib/Logger'
import { Notifier, SNSNotifier, SNSNotiferConfig } from './lib/Notifier'
import { MetricReporter, StatsDMetricReporter, StatsDMetricReporterConfig } from './lib/MetricReporter'
import { ActivityRegistry, DeciderRegistry } from './entities'

export class Config {
  swfConfig: SWFConfig
  swfClient: SWF
  logger: Logger
  notifier: Notifier
  metricReporter: MetricReporter
  domainName: string
  workflowName: string
  defaultVersion: string
  activities: ActivityRegistry
  deciders: DeciderRegistry
  domain: Domain
  fieldSerializer: FieldSerializer
  private customOpts: {[keyName: string]: any}
  private userConfig: any
  constructor(configFunc: {(): any}) {
    if (typeof configFunc !== 'function') {
      throw new Error('invalid argument to config constructor, must be a function returning an object')
    }
    const userConfig = this.populateUserConfig(configFunc())
    this.userConfig = userConfig
    this.swfClient = userConfig.swfClient || new SWF({region: userConfig.region || 'us-east-1' })


    this.domainName = userConfig.swf.domainName
    this.workflowName = userConfig.swf.workflowName
    this.defaultVersion = userConfig.defaultVersion
    this.notifier = userConfig.notifier.instance || this.buildNotifierInstance(userConfig.notifier)
    this.logger = userConfig.logger.instance || this.buildLoggerInstance(userConfig.logger)
    this.metricReporter = userConfig.metrics.instance || this.buildMetricInstance(userConfig.metrics)
    this.customOpts = this.defaultFtlConf(userConfig.ftl)
    this.swfConfig = new SWFConfig(this.defaultSwfConf(userConfig.swf))
    this.activities = this.buildActivityRegistry(userConfig.activities)
    this.deciders = this.buildDeciderRegistry()
    this.domain = userConfig.swf.domainInstance || new Domain(this.domainName, this.swfConfig, this.swfClient)

    if (!userConfig.fieldSerializer.instance) {
      let claimCheck = userConfig.claimCheck.instance || this.buildClaimCheck(userConfig.claimCheck)
      this.fieldSerializer = this.buildFieldSerializer(claimCheck, userConfig.fieldSerializer)

    } else {
      this.fieldSerializer = userConfig.fieldSerializer
    }
  }
  buildNotifierInstance(notifierConfig: any): Notifier {
    this.checkRequired('notifier', {region: 'string', snsTopicName: 'string', awsAccountId: 'string'}, notifierConfig)
    return this.handleErrorOfComponent<SNSNotifier>(new SNSNotifier(notifierConfig as SNSNotiferConfig, this), 'notifer')
  }
  buildLoggerInstance(loggerConfig: any): Logger {
    this.checkRequired('logger', {name: 'string'}, loggerConfig)
    return this.handleErrorOfComponent<Logger>(new Logger(loggerConfig), 'logger')
  }
  buildMetricInstance(metricConfig: any): MetricReporter {
    this.checkRequired('metrics', {host: 'string', port: 'number'}, metricConfig)
    return this.handleErrorOfComponent<StatsDMetricReporter>(
      new StatsDMetricReporter(metricConfig as StatsDMetricReporterConfig),
      'metricReporter'
    )
  }
  // each of our logger, notifier and metricReporters can emit what should be non fatal events
  // handle them and log them here
  private handleErrorOfComponent<T extends EventEmitter>(component: T, componentName: string): T {
    component.on('error', (err) => {
      this.logger.error(`component ${componentName} had an error`, {err})
    })
    return component
  }
  // these components don't need the same as above as their errors will be inline activity and decisions
  // erroring call stacks, which may be fatal
  buildClaimCheck(claimCheckConfig: any): S3ClaimCheck {
    this.checkRequired('claimCheck', {bucket: 'string'}, claimCheckConfig)
    return new S3ClaimCheck(claimCheckConfig.bucket, claimCheckConfig.prefix, claimCheckConfig.s3Client)
  }
  buildFieldSerializer(claimChecker: ClaimCheck, fieldSerializerConfig: any): FieldSerializer {
    return new FieldSerializer(claimChecker, fieldSerializerConfig.fields, {maxLength: fieldSerializerConfig.maxLength})
  }
  buildActivityRegistry(activityLocations: string[]): ActivityRegistry {
    let withDefaultLocs = [path.join(__dirname, './activities')].concat(activityLocations)
    return new ActivityRegistry(withDefaultLocs, this)
  }
  buildDeciderRegistry(): DeciderRegistry {
    let defaultLocs = [path.join(__dirname, './deciders')]
    return new DeciderRegistry(defaultLocs, this)
  }
  populateUserConfig(userConfig: any): any {
    if (!userConfig.defaultVersion) throw new Error('missing defaultVersion')
    userConfig.swf = userConfig.swf || {}
    userConfig.notifier = userConfig.notifier || {}
    userConfig.logger = userConfig.logger || {}
    userConfig.metrics = userConfig.metrics || {}
    userConfig.activities = userConfig.activities || []
    userConfig.ftl = userConfig.ftl || {}
    userConfig.claimCheck = userConfig.claimCheck || {}
    userConfig.fieldSerializer = userConfig.fieldSerializer || {}
    userConfig.claimCheck.prefix = userConfig.claimCheck.prefix || ''

    this.checkRequired('swf', {domainName: 'string', workflowName: 'string'}, userConfig.swf)

    return userConfig
  }
  defaultSwfConf(swfConf: any): ConfigOverrides {
    swfConf.activity = swfConf.activity || {}
    swfConf.workflow = swfConf.workflow || {}
    swfConf.decision = swfConf.decision || {}
    return _.merge(this.swfDefaults, swfConf)
  }
  defaultFtlConf(ftlConfig: {[keyName: string]: any}): {[keyName: string]: any} {
    return _.merge(this.ftlDefaults, ftlConfig || {})
  }
  getOpt(keyName: any): any {
    return this.customOpts[keyName]
  }
  getConfigFor(component: string): ConfigOverride {
    const parts = component.split('.')
    let ptr = this.userConfig
    while (parts.length) {
      ptr = ptr[parts.shift()!] || {}
    }
    return ptr
  }
  checkRequired(configName: string, required: {[key: string]: string}, parameters: any) {
    for (let key of Object.keys(required)) {
      if (!parameters[key] || typeof parameters[key] !== required[key]) {
        throw new Error(`missing config ${configName}.${key} or not of type ${required[key]}`)
      }
    }
  }
  swfDefaults = {
    activity: {
      heartbeatTimeout: 60,
      taskList: 'ftl-engine'
    },
    workflow: {
      taskList: 'ftl-engine'
    },
    decision: {
      taskList: 'ftl-engine'
    }
  }
  ftlDefaults = {
    maxRunningWorkflow: 50,
    maxRetry: 5
  }
}
