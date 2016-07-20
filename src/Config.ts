import * as path from 'path'
import { SWFConfig, ConfigOverrides } from 'simple-swf/build/src/SWFConfig'
import { Logger } from './lib/Logger'
import { Notifier, SNSNotifier, SNSNotiferConfig } from './lib/Notifier'
import { MetricReporter, StatsDMetricReporter, StatsDMetricReporterConfig } from './lib/MetricReporter'
import { ActivityRegistry } from './entities/activity/ActivityRegistry'

export class Config {
  swfConfig: SWFConfig
  logger: Logger
  notifier: Notifier
  metricReporter: MetricReporter
  domainName: string
  version: string
  maxRetry: number
  activities: ActivityRegistry
  customOpts: {[keyName: string]: any}
  constructor(configFunc: {(): any}) {
    var userConfig = configFunc()
    if (userConfig.version) throw new Error('missing version')

    userConfig.swf = userConfig.swf || {}
    userConfig.notifier = userConfig.notifier || {}
    userConfig.logger = userConfig.logger || {}
    userConfig.metrics = userConfig.metrics || {}
    userConfig.activities = userConfig.activities || []
    userConfig.ftl = userConfig.ftl || {}

    if (!userConfig.swf.domainName) throw new Error('missing swf.domainName')

    this.domainName = userConfig.swf.domainName
    this.version = userConfig.version
    this.swfConfig = new SWFConfig(this.defaultSwfConf(userConfig.swf))
    this.notifier = userConfig.notifier.instance || this.buildNotifierInstance(userConfig.notifier)
    this.logger = userConfig.logger.instance || this.buildLoggerInstance(userConfig.logger)
    this.metricReporter = userConfig.metrics.instance || this.buildMetricInstance(userConfig.metrics)
    this.activities = this.buildActivityLocations(userConfig.activities)
    this.customOpts = this.defaultFtlConf(userConfig.ftl)

  }
  buildNotifierInstance(notifierConfig: any): Notifier {
    return new SNSNotifier(notifierConfig as SNSNotiferConfig, this)
  }
  buildLoggerInstance(loggerConfig: any): Logger {
    return new Logger(loggerConfig)
  }
  buildMetricInstance(metricConfig: any): MetricReporter {
    return new StatsDMetricReporter(metricConfig as StatsDMetricReporterConfig)
  }
  buildActivityLocations(activityLocations: string[]): ActivityRegistry {
    let withDefaultLocs = [path.join(__dirname, './activities')].concat(activityLocations)
    return new ActivityRegistry(withDefaultLocs, this)
  }
  defaultSwfConf(swfConf: any): ConfigOverrides {
    swfConf.activity = swfConf.activity || {}
    swfConf.workflow = swfConf.workflow || {}
    swfConf.decision = swfConf.decision || {}
    return _.merge(this.swfDefaults, swfConf)
  }
  defaultFtlConf(ftlConfig: {[keyName: string]: any}): {[keyName: string]: any} {
    return _.merge(this.ftlDefaults, ftlConfig)
  }
  getOpt(keyName: any): any {
    return this.customOpts[keyName]
  }
  swfDefaults: {
      activity: {
          heartbeatTimeout: number
          taskList: string
      }
      workflow: {
          taskList: string
      }
      decision: {
          taskList: string
      }
  }
  ftlDefaults: {
      maxRunningWorkflow: number
  }
}
