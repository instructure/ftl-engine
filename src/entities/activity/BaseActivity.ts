import { Activity as SWFActivity, ActivityType, Workflow } from 'simple-swf/build/src/entities'
import { ActivityTask } from 'simple-swf/build/src/tasks'
import { StopReasons } from 'simple-swf/build/src/interfaces'

import { Config } from '../../Config'
export interface FTLRunCallabck {
  (Error?: any, any?: any, Object?: any): any;
}
// we make this nicer for non-TS implementors by throwing erros instead
// of using an abstract class
export class FTLActivity {
  constructor(parameters: any, env?: any, config?: Config) {
  }
  run(cb: FTLRunCallabck) {
    throw new Error('run must be extended by child class')
  }
  status(): any {
    throw new Error('status must be extended by child class')
  }
  stop(cb: {(Error?)}) {
    throw new Error('stop must be extended by child class')
  }
  static getHandlerName(): string {
    return ''
  }
  static validateTask(parameters: any): string | null {
    throw new Error('must provide validateTask function')
  }
  static maxConcurrent?: number
  static version?: string
}
export class BaseActivity extends SWFActivity {
  activityClass: typeof FTLActivity
  config: Config
  activity: FTLActivity

  constructor(
    config: Config,
    activityClass: typeof FTLActivity,
    workflow: Workflow,
    activityType: ActivityType,
    task: ActivityTask
  ) {
    super(workflow, activityType, task)
    this.activityClass = activityClass
    this.config = config
  }
  run(input: any, cb: FTLRunCallabck) {
    this.activity = new this.activityClass(input.parameters, input.env || {}, this.config)
    this.activity.run(cb)
  }
  status(): any {
    return this.activity.status()
  }
  stop(reason: StopReasons, cb: {(Error?)}) {
    this.activity.stop(cb)
  }
}
