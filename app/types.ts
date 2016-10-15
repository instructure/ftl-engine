export interface IWorkflowId {
  workflowId: string
  runId: string
}
export interface IWorkflowInfo {
  execution: IWorkflowId
  status: string
  startTimestamp: string
  cancelRequested: boolean
  domain: string
  workflowType: {
    name: string,
    version: string
  }
}
