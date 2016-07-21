import * as path from 'path'
import { Registry } from '../Registry'
import { BaseDecider } from './BaseDecider'

export class DeciderRegistry extends Registry<typeof BaseDecider> {
  wrapModule(filename: string, handler: any): typeof BaseDecider {
    if (handler.default) {
      handler = handler.default
    }
    if (typeof handler !== 'function') throw new Error(`decider module ${filename} doesn't export single class or default export`)

    let name: string
    if (handler.getHandlerName && handler.getHandlerName()) {
      name = handler.getHandlerName()
    } else {
      handler.getHandlerName = function(): string {
        return path.basename(filename, path.extname(filename))
      }
      name = handler.getHandlerName()
    }
    if (!name) throw new Error('missing decider name')
    if (!handler.validateTask)
        throw new Error(`decider module ${name} does not have a static validateTask function`)
    if (!handler.getChildren)
        throw new Error(`decider module ${name} does not implement a static getChildren method`)
    if (!handler.prototype.makeDecisions)
        throw new Error(`decider module ${name} does not implement a makeDecisions method`)
    return handler as typeof BaseDecider
  }
}
