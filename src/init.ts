let haveRegistered = false
import * as _ from 'lodash'
import { Workflow, Domain } from 'simple-swf/build/src/entities'
import { ActivityWorker, DeciderWorker } from './workers'
import { Config } from './Config'
let registration = {
  registerDomain(config: Config, cb: {(Error?, Domain?)}) {
    config.domain.ensureDomain(config.getConfigFor('domain'), (err, created) => {
      if (err) return cb(err)
      config.logger.info(`domain  ${config.domain.name} ${created ? 'was created' : 'already exists'}`)
      cb(null, config.domain)
    })
  },
  registerWorkflowType(config: Config, domain: Domain, cb: {(Error?, Workflow?)}) {
    let workflow = new Workflow(domain, config.workflowName, config.defaultVersion, config.fieldSerializer)
    workflow.ensureWorkflow(config.getConfigFor('workflow'), (err, created) => {
      if (err) return cb(err)
      config.logger.info(`workflow ${workflow.name} ${created ? 'was created' : 'already exists'}`)
      cb(null, workflow)
    })
  },
  init(config: Config, cb: {(Error?, Workflow?, Domain?, ActivityWorker?, DeciderWorker?)}) {
    if (haveRegistered) return cb()
    registration.registerDomain(config, (err, domain) => {
      if (err) return cb(err)
      registration.registerWorkflowType(config, domain, (err, workflow) => {
        if (err) return cb(err)
        haveRegistered = true
        const actWorker = registration.initActivityWorker(config, workflow)
        const decWorker = registration.initDeciderWorker(config, workflow)
        cb(null, workflow, domain, actWorker, decWorker)
      })
    })
  },
  initActivityWorker(config: Config, workflow: Workflow) {
    let worker = new ActivityWorker(workflow, config, config.getConfigFor('activityWorker'))
    config.activities.getModules().map((actType) => worker.registerActivityType(actType))
    return worker
  },
  initDeciderWorker(config: Config, workflow: Workflow) {
    let TaskGraph = config.deciders.getModule('taskGraph')
    if (!TaskGraph) throw new Error('missing taskGraph plugin...')
    let taskGraphDecider = new TaskGraph(config, workflow)
    return new DeciderWorker(taskGraphDecider, config, config.getConfigFor('deciderWorker'))
  }
}
export {registration}
