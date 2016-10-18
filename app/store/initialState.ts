import * as moment from 'moment'
import { AllState } from '../types'
import Api from '../api'
export default function(props: any) {
  return {
    app: {
      api: new Api,
      changeWorkflow: false,
      workflowTreeOpen: false,
      workflowFetchOpts: {
        closedWorkflows: false,
        startDate: moment().subtract(2, 'days').toDate(),
        startTime: moment().subtract(2, 'days').startOf('day').toDate(),
        endDate: new Date(),
        endTime: new Date()
      },
      focusedWorkflowItem: '',
      workflowExpandedStates: {},
      domains: [],
      workflows: [],
      err: null
    }
  } as AllState
}
