import { BaseDecider } from '../entities'
import { DecisionTask, EventData } from 'simple-swf/build/src/tasks'

// currently, this class only exists for validation! at some point in the future
// when we have pluggable deciders, this should become a real thing
export default class RecordMarker extends BaseDecider {
  makeDecisions(task: DecisionTask, cb: {(Error?)}): any {
  }
  static getChildren() {
    return []
  }
  static validateTask(parameters: any): string | null {
    if (!parameters.status) return 'missing "status" field in parameters'
    return null
  }
}
