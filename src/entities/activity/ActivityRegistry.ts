import * as path from 'path'
import { ActivityType } from './ActivityType'
import { FTLActivity } from './BaseActivity'
import { Registry } from '../Registry'

export class ActivityRegistry extends Registry<ActivityType> {
  wrapModule(filename: string, handler: any): ActivityType {
    if (handler.default) {
      handler = handler.default
    }
    if (typeof handler !== 'function') throw new Error(`activity module ${filename} doesn't export single class function`)

    let name: string
    if (handler.getHandlerName && handler.getHandlerName()) {
      name = handler.getHandlerName()
    } else {
      handler.getHandlerName = function(): string {
        return path.basename(filename, path.extname(filename))
      }
      name = handler.getHandlerName()
    }
    if (!name) throw new Error('missing activity name')
    if (!handler.validateTask)
        throw new Error(`activity module ${name} does not have a static validateTask function`)
    if (!handler.prototype.run)
        throw new Error(`activity module ${name} does not implement a run method`)
    if (!handler.prototype.status)
        throw new Error(`activity module ${name} does not implement a status method`)
    if (!handler.prototype.stop)
        throw new Error(`activity module ${name} does not implement a stop method`)
    return new ActivityType(handler as typeof FTLActivity, filename, this.config)
  }
}
