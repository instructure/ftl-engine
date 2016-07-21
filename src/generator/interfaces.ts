export interface Task {
  handler: string,
  parameters: any
}
export interface ITaskBuilder {
  create(args: any, state: any, cb: {(err: Error | null, task: Task | null)})
  create(args: any, state: any): Task
  dependsOn?: string[]
  setState?: {(state: any, cb: {(err: Error | null, state: any)})}

}
