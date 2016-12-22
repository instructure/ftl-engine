import { assert } from 'chai'

import * as _ from 'lodash'
import { default as newContext, SinonHelper, ClassMock } from '../../sinonHelper'
import {FTLActivity} from '../../../src/entities/activity'
import {Config} from '../../../src/Config'
import {ActivityRegistry} from '../../../src/entities/activity'

describe('ActivityRegistry', () => {

  const reg = Object.create(ActivityRegistry.prototype)
  let sandbox = newContext()
  let config = sandbox.stubClass<Config>(Config)
  reg.config = config
  class TestActivity extends FTLActivity {
    run(cb) {
      cb(null, 'good!', {success: true})
    }
    status() {
      return 'status'
    }
    stop(cb) {
      cb(null)
    }
    static getHandlerName() {
      return 'mocked'
    }
  }


  describe('wrapModule', () => {
    it('should work with es6 module default', () => {
      reg.wrapModule('testActivity.js', {default: TestActivity})
    })
    it('should work if its a function itself', () => {
      reg.wrapModule('testActivity.js', TestActivity)
    })
    it('should throw an error if its not a function', () => {
      assert.throws(reg.wrapModule.bind(reg, 'testActivity.js', {}))
    })
    it('should get the name from getHandlerName()', () => {
      const actType = reg.wrapModule('testActivity.js', TestActivity)
      assert.equal(actType.getHandlerName(), 'mocked')
    })
    it('should use the filename if it has too', () => {
      class NoNameActivity extends TestActivity {
      }
      // just do some nastiness to kill the method
      const nna = NoNameActivity as any
      nna.getHandlerName = null
      const actType = reg.wrapModule('testActivity.js', NoNameActivity)
      assert.equal(NoNameActivity.getHandlerName(), 'testActivity', 'it adds a handler')
      assert.equal(actType.getHandlerName(), 'testActivity')
    })
    it('should validate the validateTask method', () => {
      class NoValidate extends TestActivity {
      }
      // just do some nastiness to kill the method
      const nv = NoValidate as any
      nv.validateTask = null
      assert.throws(reg.wrapModule.bind(reg, 'testActivity.js', NoValidate), /static validateTask/)
    })
    it('should validate the prototype.run method', () => {
      class NoRun extends TestActivity {
      }
      // just do some nastiness to kill the method
      const nr = NoRun as any
      nr.prototype.run = null
      assert.throws(reg.wrapModule.bind(reg, 'testActivity.js', NoRun), /implement a run method/)
    })
    it('should validate the prototype.status method', () => {
      class NoStatus extends TestActivity {
      }
      // just do some nastiness to kill the method
      const ns = NoStatus as any
      ns.prototype.status = null
      assert.throws(reg.wrapModule.bind(reg, 'testActivity.js', NoStatus), /implement a status method/)
    })
    it('should validate the prototype.stop method', () => {
      class NoStop extends TestActivity {
      }
      // just do some nastiness to kill the method
      const ns = NoStop as any
      ns.prototype.stop = null
      assert.throws(reg.wrapModule.bind(reg, 'testActivity.js', NoStop), /implement a stop method/)
    })
  })
})
