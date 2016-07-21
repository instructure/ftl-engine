import { Config } from '../Config'
import { BaseHandler, BaseDecider } from '../entities'
const validator = {
  validate(config: Config, workflow: any) {
    if (workflow.type !== 'decision') return 'top level workflow item must be decision task'
    const leftToCheck = [workflow]
    while (leftToCheck.length) {
      const toCheck = leftToCheck.shift()
      if (typeof toCheck !== 'object') return 'task is malformed'
      if (!toCheck.name) return `task ${toCheck.id} does not have a name`
      if (!toCheck.id) return `task ${toCheck.name} does not have an id`
      if (!toCheck.handler) return `task id: ${toCheck.id} name: ${toCheck.name} does not define a handler`
      if (!toCheck.parameters) return `task id: ${toCheck.id} name: ${toCheck.name} does not define parameters`
      if (toCheck.maxRetry && typeof toCheck.maxRetry !== 'number') {
        return `task id: ${toCheck.id} name: ${toCheck.name} gave a maxRetry but of an invalid type`
      }
      if (typeof toCheck.parameters !== 'object') return `task id: ${toCheck.id} name: ${toCheck.name} does not object for parameters`

      let handler: BaseHandler | null = null
      if (toCheck.type === 'decision') {
        handler = config.deciders.getModule(toCheck.handler)
      } else {
        let actType = config.activities.getModule(toCheck.handler)
        if (actType) {
          handler = actType.ActivityHandler
        }
      }
      if (!handler) return `${toCheck.type || 'activity'} node name: ${toCheck.name},
       id: ${toCheck.id} did not define a known handler, gave ${toCheck.handler}`
      let invalidReason = handler.validateTask(toCheck.parameters)
      if (invalidReason) {
        return `task ${toCheck.name}, id: ${toCheck.id}, handler: ${toCheck.handler}, was invalid: ${invalidReason}`
      }

      if (toCheck.type === 'decision') {
        let decisionHandler = handler as typeof BaseDecider
        let children = decisionHandler.getChildren(toCheck.parameters)
        if (!Array.isArray(children)) {
          children = [children]
        }
        leftToCheck.push(...children)
      }
    }
    return null
  }
}

export { validator }
