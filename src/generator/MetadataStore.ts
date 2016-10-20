import { ITaskBuilder } from './interfaces'
export interface TaskFilters {
  include?: RegExp[],
  exclude?: RegExp[]
}

export class MetadataStore {
  private state: any
  private filters: TaskFilters
  constructor(initial: Object, filters: TaskFilters = {}) {
    this.state = initial
    this.filters = filters
  }
  updateState(taskBuilder: ITaskBuilder, cb: {(err?: Error)}) {
    if (!taskBuilder.setState) return cb()
    taskBuilder.setState(this.state, (err, state) => {
      if (err) return cb(err)
      this.state = state
      cb()
    })
  }
  getState() {
    return this.state
  }
  getFilters() {
    return this.filters
  }
}
