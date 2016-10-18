import {
  TaskGraphNode,
  TaskGraphGraph,
  TaskGraphParameters,
  TaskGraphGraphNode,
  TaskGraphActivityNode,
  TaskGraphMarkerNode,
  NodeDetails,
  AllNodeTypes
} from '../deciders/TaskGraph'
import { TaskInput } from 'simple-swf/build/src/interfaces'
import { EventData } from 'simple-swf/build/src/tasks/EventRollup'
import { ExecutionHistory } from 'simple-swf/build/src/entities/WorkflowExecution'

export interface GenericTaskInput<T> extends TaskInput {
  input: T
}
export interface GenericExecutionHistory<T> extends ExecutionHistory {
  wfInput: GenericTaskInput<T>
}

export interface WorkflowId {
  workflowId: string
  runId: string
}
export interface WorkflowInfo {
  execution: WorkflowId
  status: string
  startTimestamp: string
  cancelRequested: boolean
  domain: string
  workflowType: {
    name: string,
    version: string
  }
}
export interface ApiResp<T> {
  success: boolean,
  data: T
}
export interface ListDomainsResp extends ApiResp<string[]> {
}
export interface ListWorkflowsResp extends ApiResp<WorkflowInfo[]> {
}
export interface GraphExecutionHistory extends GenericExecutionHistory<TaskGraphNode> {
}
export interface GetWorkflowResp extends ApiResp<GraphExecutionHistory> {
}

// export all the task graph stuff as well
export {
  TaskGraphNode,
  TaskGraphGraph,
  TaskGraphParameters,
  TaskGraphGraphNode,
  TaskGraphActivityNode,
  TaskGraphMarkerNode,
  NodeDetails,
  AllNodeTypes
} from '../deciders/TaskGraph'
