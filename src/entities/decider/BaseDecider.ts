import { Workflow, Decider } from 'simple-swf/build/src/entities'
import { DecisionTask } from 'simple-swf/build/src/tasks'

import { Config } from '../../Config'
import { ActivityRegistry } from '../activity'
import { Logger } from '../../lib'

export class BaseDecider extends Decider {
  ftlConfig: Config
  activities: ActivityRegistry
  logger: Logger

  constructor(config: Config, workflow: Workflow) {
    super(workflow)
    this.ftlConfig = config
    this.activities = config.activities
    this.logger = config.logger
  }

  makeDecisions(task: DecisionTask, cb: {(err: Error, decision: DecisionTask)}) {
    throw new Error('must implement')
  }
  static validateTask(parameters: any): string | null {
    throw new Error('validateTask must be overriden')
  }
  static getChildren(paramenters: any): any[] | any {
    throw new Error('getChildren must be overriden')
  }
  // we return an empty string here as we need the method, but we want to try our default implentation
  static getHandlerName(): string {
    return ''
  }
}
