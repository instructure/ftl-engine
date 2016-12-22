import { assert } from 'chai'

import { default as newContext, SinonHelper, ClassMock } from '../../sinonHelper'
import {FTLActivity, BaseActivity} from '../../../src/entities/activity'
import {Config} from '../../../src/Config'
import { Logger, StatsDMetricReporter, Notifier } from '../../../src/lib'
import {ActivityType, Workflow} from 'simple-swf/build/src/entities'
import { ActivityTask } from 'simple-swf/build/src/tasks'
import { StopReasons } from 'simple-swf/build/src/interfaces'

describe('FTLActivity', () => {
  it('should throw an error on all methods', () => {
    const act = new FTLActivity({}, {}, {} as Config)
    assert.throws(act.run.bind(act, (err, status, env) => null))
    assert.throws(act.status)
    assert.throws(act.stop.bind(act, (err) => null))
    assert.throws(FTLActivity.validateTask.bind(FTLActivity, {}))
    assert.equal(FTLActivity.getHandlerName(), '')
  })
})

class TestGoodActivity extends FTLActivity {
  runCalled: boolean
  statusCalled: boolean
  stopCalled: boolean
  receivedInput: any
  receivedEnv: any
  receivedConfig: any
  constructor(input, env, config) {
    super(input, env, config)
    this.receivedInput = input
    this.receivedEnv = env
    this.receivedConfig = config
  }
  run(cb) {
    this.runCalled = true
    cb(null, 'good!', {success: true})
  }
  status() {
    this.statusCalled = true
    return 'status'
  }
  stop(cb) {
    this.stopCalled = true
    cb(null)
  }
}
class TestErrorActivity extends TestGoodActivity {
  run(cb) {
    this.runCalled = true
    cb(new Error('oh no!'), 'fail')
  }
}
class TestObjectActivity extends TestGoodActivity {
  run(cb) {
    this.runCalled = true
    cb(null, {someRes: true})
  }
}
class TestErrorStopActivity extends TestGoodActivity {
  stop(cb) {
    this.stopCalled = true
    cb(new Error('oh no!'), 'fail')
  }
}
describe('BaseActivity', () => {
  describe('run()', () => {
    let sandbox = newContext()
    let config = sandbox.stubClass<Config>(Config)
    config.workflowName = "foobar"
    config.logger = sandbox.stubClass<Logger>(Logger)
    let actType = sandbox.stubClass<ActivityType>(ActivityType)
    it('should call run on the activity class passed in', (done) => {
      const act = new BaseActivity(
        config, TestGoodActivity, {} as Workflow, actType,
        {rawTask: {activityId: 'foo'}} as ActivityTask
      )
      act.run({parameters: {someInput: true}}, {startEnv: true}, (err, status) => {
        assert.ifError(err)
        assert.equal(status.status, 'good!')
        assert.deepEqual(status.env, {success: true})
        assert.equal(status.info, null)
        const innerAct = act.activity as TestGoodActivity
        assert(innerAct.runCalled)
        assert.deepEqual(innerAct.receivedInput, {someInput: true})
        assert.deepEqual(innerAct.receivedEnv, {startEnv: true})
        assert.equal(innerAct.receivedConfig, config)
        done()
      })
    })
    it('should handle errors in activities', (done) => {
      const act = new BaseActivity(
        config, TestErrorActivity, {} as Workflow, actType,
        {rawTask: {activityId: 'foo'}} as ActivityTask
      )
      act.run({someInput: true}, {startEnv: true}, (err, status) => {
        assert(err instanceof Error)
        const innerAct = act.activity as TestErrorActivity
        assert(innerAct.runCalled)
        done()
      })
    })
    it('should handle object results in activities', (done) => {
      const act = new BaseActivity(
        config, TestObjectActivity, {} as Workflow, actType,
        {rawTask: {activityId: 'foo'}} as ActivityTask
      )
      act.run({someInput: true}, {startEnv: true}, (err, status) => {
        assert.ifError(err)
        assert.equal(status.status, 'success')
        assert.deepEqual(status.info, {someRes: true})
        const innerAct = act.activity as TestObjectActivity
        assert(innerAct.runCalled)
        done()
      })
    })
  })
  describe('stop()', () => {
    let sandbox = newContext()
    let config = sandbox.stubClass<Config>(Config)
    config.logger = sandbox.stubClass<Logger>(Logger)
    config.workflowName = "foobar"
    config.logger
    let actType = sandbox.stubClass<ActivityType>(ActivityType)
    it('should call stop on the child activity', (done) => {
      const act = new BaseActivity(
        config, TestGoodActivity, {} as Workflow, actType,
        {rawTask: {activityId: 'foo'}} as ActivityTask
      )
      act.activity = new TestGoodActivity({}, {}, config)
      act.stop(StopReasons.WorkflowCancel, (err) => {
        assert.ifError(err)
        const innerAct = act.activity as TestGoodActivity
        assert(innerAct.stopCalled)
        done()
      })
    })

    it('should handle stop errors on the child activity', (done) => {
      const act = new BaseActivity(
        config, TestErrorStopActivity, {} as Workflow, actType,
        {rawTask: {activityId: 'foo'}} as ActivityTask
      )
      act.activity = new TestErrorStopActivity({}, {}, config)
      act.stop(StopReasons.ProcessExit, (err) => {
        assert(err instanceof Error)
        const innerAct = act.activity as TestErrorStopActivity
        assert(innerAct.stopCalled)
        done()
      })

    })
  })
  describe('status()', () => {
    let sandbox = newContext()
    let config = sandbox.stubClass<Config>(Config)
    config.workflowName = "foobar"
    config.logger = sandbox.stubClass<Logger>(Logger)
    let actType = sandbox.stubClass<ActivityType>(ActivityType)
    it('should call status on the child activity', () => {
      const act = new BaseActivity(
        config, TestGoodActivity, {} as Workflow, actType,
        {rawTask: {activityId: 'foo'}} as ActivityTask
      )
      act.activity = new TestGoodActivity({}, {}, config)
      assert.equal(act.status(), 'status')
      const innerAct = act.activity as TestGoodActivity
      assert(innerAct.statusCalled)
    })
  })
})
