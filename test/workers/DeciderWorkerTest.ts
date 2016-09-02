import { assert } from 'chai'

import { DeciderWorker } from '../../src/workers/DeciderWorker'

import { default as newContext, SinonHelper, ClassMock } from '../sinonHelper'
import { Config } from '../../src/Config'
import { Logger, StatsDMetricReporter, Notifier } from '../../src/lib'
import { Decider } from 'simple-swf/build/src/entities'
import { DecisionTask } from 'simple-swf/build/src/tasks'

describe('DeciderWorker', () => {
  describe('onDecisionMade', () => {
    let sandbox = newContext()
    let decider = {workflow: {}} as Decider
    let config = sandbox.stubClass<Config>(Config)
    config.logger = sandbox.stubClass<Logger>(Logger)
    config.metricReporter = sandbox.stubClass<StatsDMetricReporter>(StatsDMetricReporter)

    it('should be triggered when a "madeDecision" event happens', (done) => {
      class OnMadeOverride extends DeciderWorker {
        onDecisionMade(task: DecisionTask) {
          done()
        }
      }
      let worker = new OnMadeOverride(decider, config, {})
      worker.emit('madeDecision')
    })
    it('should alert if their are any failed workflow decisions', (done) => {
      let worker = new DeciderWorker(decider, config, {})
      let task = sandbox.stubClass<DecisionTask>(DecisionTask)
      task.getWorkflowInfo = function() {
        return {workflowId: 'decTask', runId: 'fake'}
      }
      task.decisions = [
        {
          entities: ['workflow'],
          overrides: {},
          decision: {
            decisionType: 'FailWorkflowExecution',
            failWorkflowExecutionDecisionAttributes: {reason: 'fake', details: 'stuff'}
          }
        }
      ]
      config.notifier = {
        sendError(msg: string, event: any) {
          assert.equal(msg, 'workflowFailed')
          assert.deepEqual(event.workflow, {workflowId: 'decTask', runId: 'fake'})
          done()
        }
      } as Notifier

      worker.onDecisionMade(task)

    })

  })

})
