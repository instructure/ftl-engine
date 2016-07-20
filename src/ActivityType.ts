import { ActivityType as SWFActivtyType, Workflow } from 'simple-swf/src/entities'
import { ActivityTask } from 'simple-swf/src/tasks'
import { BaseActivity, FTLActivity } from './BaseActivity'
import { Config } from './Config'

export class ActivityType extends SWFActivtyType {
  ActivityHandler: typeof FTLActivity
  config: Config
  constructor(HandlerClass: typeof FTLActivity, loadLocation: string, config: Config) {
    const version = config.version
    const maxRetry = config.maxRetry
    super(HandlerClass.getHandlerName(), version, BaseActivity, { maxRetry: maxRetry })
    this.ActivityHandler = HandlerClass
    this.config = config
  }
  createExecution(workflow: Workflow, task: ActivityTask): BaseActivity {
    return new BaseActivity(this.config, this.ActivityHandler, workflow, this, task)
  }
  getHandlerName(): string {
    return this.ActivityHandler.getHandlerName()
  }
  getMaxConcurrent(): number | null {
    return this.ActivityHandler.maxConcurrent || null
  }
}
