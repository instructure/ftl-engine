import * as moment from 'moment'
export default function(props: any) {
  return {
    app: {
      changeWorkflow: false,
      workflowFetchOpts: {
        closedWorkflows: false,
        startDate: moment().subtract(2, 'days').toDate(),
        startTime: moment().subtract(2, 'days').startOf('day').toDate(),
        endDate: new Date(),
        endTime: new Date()
      },
      domains: [],
      workflows: [],
      err: null
    }
  }
}
