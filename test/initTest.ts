import { assert } from 'chai'
import { registration } from '../src/init'
import { SWF } from 'aws-sdk'
import { Workflow, Domain } from 'simple-swf/build/src/entities'
import { SWFConfig } from 'simple-swf/build/src/SWFConfig'
import { Config } from '../src/'
import MockLogger from './fixtures/mockLogger'


describe('init', () => {
  const mockConfig = new SWFConfig()
  const mockDomain = new Domain('mock', mockConfig)
  describe('init', () => {
    it('should properly init', (done) => {
      let registerWFCalled = false
      let registerDCalled = false
      let mockConfig = Object.create(Config.prototype) as any
      mockConfig.domain = mockDomain
      mockConfig.userConfig = {
        swf: {
          domain: 'mock'
        }
      }
      mockConfig.deciders = {
        getModule() {
          // mock taskGraph
          return function(wf) {
            this.workflow = wf
          }
        }
      }
      mockConfig.activities = {
        getModules() {
          return []
        }
      }
      mockConfig = mockConfig as Config
      mockConfig.logger = new MockLogger()

      const mockClient = {
        registerWorkflowType(params, cb) {
          registerWFCalled = true
          cb()
        }
      }
      mockDomain.ensureDomain  = function(domainName, cb) {
        registerDCalled = true
        cb(null!, true)
      }
      mockDomain.swfClient = mockClient as SWF
      registration.init(mockConfig, (err, initedEnts) => {
        assert.ifError(err)
        done()

      })

    })
  })
})
