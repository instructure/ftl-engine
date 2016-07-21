import { ITaskBuilder } from './interfaces'
export class MetadataStore {
  private state: any
  constructor(initial: Object) {
    this.state = initial
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
}
