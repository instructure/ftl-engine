import { ActivityType as SWFActivtyType, Workflow } from 'simple-swf/build/src/entities'
import { ActivityTask } from 'simple-swf/build/src/tasks'
import { BaseActivity, FTLActivity } from './BaseActivity'
import { BaseHandler } from '../BaseHandler'
import { Config } from '../../Config'

export class ActivityType extends SWFActivtyType implements BaseHandler {
  ActivityHandler: typeof FTLActivity
  config: Config
  loadLocation: string
  constructor(HandlerClass: typeof FTLActivity, loadLocation: string, config: Config) {
    const version = HandlerClass.version || config.defaultVersion
    const maxRetry = HandlerClass.maxRetry || config.getOpt('maxRetry')
    super(HandlerClass.getHandlerName(), version, BaseActivity, { maxRetry: maxRetry })
    this.ActivityHandler = HandlerClass
    this.loadLocation = loadLocation
    this.config = config
  }
  createExecution(workflow: Workflow, task: ActivityTask): BaseActivity {
    return new BaseActivity(this.config, this.ActivityHandler, workflow, this, task)
  }
  getHandlerName(): string {
    return this.ActivityHandler.getHandlerName()
  }
  validateTask(parameters: any): string | null {
    return this.ActivityHandler.validateTask(parameters)
  }
  getMaxConcurrent(): number | null {
    return this.ActivityHandler.maxConcurrent || null
  }
  getMaxRetry(): number | null {
    return this.ActivityHandler.maxRetry || null
  }
  getUIComponentPath(): string | null {
    return this.ActivityHandler.UIComponentPath || null
  }
}
