import { assert } from 'chai'
import { validator } from '../../src/lib/validator'
import { Config } from '../../src/Config'
import * as _ from 'lodash'

describe('validator', () => {
  describe('validate', () => {
    describe('valid', () => {
      const mockHandler = {
        validateTask() {
          return null
        },
        getChildren(thing) {
          return thing.children
        }
      } as any
      mockHandler.ActivityHandler = mockHandler
      const mockConfig = {
        activities: {
          getModule() {
            return mockHandler
          }
        },
        deciders: {
          getModule() {
            return mockHandler
          }
        }
      } as any
      it('should return no errors for a valid workflow', () => {
        const wf = {
          name: 'mock',
          id: 'mock0',
          handler: 'mock',
          type: 'decision',
          parameters: {
            children: [
              {
                name: 'mockAct',
                id: 'mockAct0',
                handler: 'mock',
                type: 'activity',
                parameters: {}
              },
              {
                name: 'mockAct',
                id: 'mockAct1',
                handler: 'mock',
                type: 'activity',
                parameters: {}
              },
              {
                name: 'mock',
                id: 'mock0',
                handler: 'mock',
                type: 'decision',
                parameters: {
                  children: []
                }
              }
            ]
          }
        }
        assert.doesNotThrow(() => {
          validator.validate(mockConfig as Config, wf)
        })
      })
    })
    describe('invalid', () => {
      let nextInvalid: string | null = null
      let nextChildrenHandler = (e) => e.children
      const mockHandler = {
        validateTask() {
          return nextInvalid
        },
        getChildren(thing) {
          return nextChildrenHandler(thing)
        }
      } as any
      let nextActHandler = mockHandler
      let nextDecHandler = mockHandler
      mockHandler.ActivityHandler = mockHandler
      const mockConfig = {
        activities: {
          getModule() {
            return nextActHandler
          }
        },
        deciders: {
          getModule() {
            return nextDecHandler
          }
        }
      } as any as Config
      beforeEach(() => {
        let nextInvalid = null
        let nextChildrenHandler = (e) => e.children
        let nextActHandler = mockHandler
        let nextDecHandler = mockHandler
      })
      it('should complain if top level task is not a decision', () => {
        const wf = {
          type: 'activity',
          name: 'top',
          id: 'top0',
          handler: 'mock',
          parameters: {
            children: [
              'blah'
            ]
          }
        }
        assert.match(validator.validate(mockConfig, 'blah')!, /must be decision task/)
      })
      it('should complain about tasks that are not valid objects', () => {
        const wf = {
          type: 'decision',
          name: 'top',
          id: 'top0',
          handler: 'mock',
          parameters: {
            children: [
              'blah'
            ]
          }
        }
        assert.match(validator.validate(mockConfig, wf)!, /task is malformed/)
      })
      const baseTask = {
        name: 'mock',
        id: 'mock0',
        handler: 'mock',
        type: 'decision',
        parameters: {}
      }
      for (let k in baseTask) {
        if (k === 'type') continue
        const wf = _.omit(_.clone(baseTask), k)
        it(`should complain if task has no ${k} field`, () => {
          assert.match(validator.validate(mockConfig, wf)!, new RegExp(`does not .* ${k}`))
        })
      }
      it('should complain if no handler is found', () => {
        nextDecHandler = null
        const wf = {
          type: 'decision',
          name: 'top',
          id: 'top0',
          handler: 'notFound',
          parameters: {}
        }
        assert.match(validator.validate(mockConfig, wf)!, /did not define a known handler/)
      })
      it('should complain if handler rejects', () => {
        nextDecHandler = mockHandler
        nextInvalid = 'this is really silly'
        const wf = {
          type: 'decision',
          name: 'top',
          id: 'top0',
          handler: 'mock',
          parameters: {}
        }
        assert.match(validator.validate(mockConfig, wf)!, /this is really silly/)
      })
    })
  })
})
