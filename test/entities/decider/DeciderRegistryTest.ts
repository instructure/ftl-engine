import { assert } from 'chai'

import * as _ from 'lodash'
import { default as newContext, SinonHelper, ClassMock } from '../../sinonHelper'
import {BaseDecider} from '../../../src/entities/decider'
import {Config} from '../../../src/Config'
import {DeciderRegistry} from '../../../src/entities/decider'

describe('DeciderRegistry', () => {

  const reg = Object.create(DeciderRegistry.prototype)
  let sandbox = newContext()
  let config = sandbox.stubClass<Config>(Config)
  reg.config = config
  class TestDecider extends BaseDecider {
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
      reg.wrapModule('testDecider.js', {default: TestDecider})
    })
    it('should work if its a function itself', () => {
      reg.wrapModule('testDecider.js', TestDecider)
    })
    it('should throw an error if its not a function', () => {
      assert.throws(reg.wrapModule.bind(reg, 'testDecider.js', {}))
    })
    it('should get the name from getHandlerName()', () => {
      const actType = reg.wrapModule('testDecider.js', TestDecider)
      assert.equal(actType.getHandlerName(), 'mocked')
    })
    it('should use the filename if it has too', () => {
      class NoNameDecider extends TestDecider {
      }
      // just do some nastiness to kill the method
      const nnd = NoNameDecider as any
      nnd.getHandlerName = null
      const decider = reg.wrapModule('testDecider.js', NoNameDecider)
      assert.equal(NoNameDecider.getHandlerName(), 'testDecider', 'it adds a handler')
    })
    it('should validate the validateTask method', () => {
      class NoValidate extends TestDecider {
      }
      // just do some nastiness to kill the method
      const nv = NoValidate as any
      nv.validateTask = null
      assert.throws(reg.wrapModule.bind(reg, 'testDecider.js', NoValidate), /static validateTask/)
    })
    it('should validate the getChildren method', () => {
      class NoGetChildren extends TestDecider {
      }
      // just do some nastiness to kill the method
      const ngc = NoGetChildren as any
      ngc.getChildren = null
      assert.throws(reg.wrapModule.bind(reg, 'testDecider.js', NoGetChildren), /static getChildren/)
    })
    it('should validate the prototype.makeDecisions method', () => {
      class NoMakeDecisions extends TestDecider {
      }
      // just do some nastiness to kill the method
      const nmd = NoMakeDecisions as any
      nmd.prototype.makeDecisions = null
      assert.throws(reg.wrapModule.bind(reg, 'testDecider.js', NoMakeDecisions), /implement a makeDecisions method/)
    })
  })
})
