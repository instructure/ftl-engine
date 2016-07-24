import { EventEmitter } from 'events'
import SDC = require('statsd-client')
import { Config } from '../Config'

export interface MetricReporter extends EventEmitter {
  increment(name: string, count?: number, meta?: Object): any
  decrement(name: string, count?: number, meta?: Object): any
  counter(name: string, count: number, meta?: Object): any
  gauge(name: string, value: number, meta?: Object): any
  gaugeDelta(name: string, delta: number, meta?: Object): any
  set(name: string, value: number, meta?: Object): any
  timing(name: string, value: Date, meta?: Object): any
  timing(name: string, duration: number, meta?: Object): any
}

export interface StatsDMetricReporterConfig {
  mode?: 'udp' | 'tcp'
  host: string
  port: number
  prefix?: string
  statsdClient?: SDC
}

export class StatsDMetricReporter extends EventEmitter implements MetricReporter {
  client: SDC
  config: StatsDMetricReporterConfig
  constructor(config: StatsDMetricReporterConfig) {
    super()
    this.config = config
    this.client = config.statsdClient || new SDC(config)
  }
  increment(name: string, count?: number, meta?: Object) {
    this.client.increment(name, count)
  }
  decrement(name: string, count?: number, meta?: Object) {
    this.client.decrement(name, count)
  }
  counter(name: string, count: number, meta?: Object) {
    this.client.counter(name, count)
  }
  gauge(name: string, value: number, meta?: Object) {
    this.client.gauge(name, value)
  }
  gaugeDelta(name: string, delta: number, meta?: Object) {
    this.client.gaugeDelta(name, delta)
  }
  set(name: string, value: number, meta?: Object) {
    this.client.set(name, value)
  }
  timing(name: string, value: Date | number, meta?: Object) {
    if (typeof value === 'number') {
      this.client.timing(name, value)
    }
    else {
      this.client.timing(name, value)
    }
  }
}
