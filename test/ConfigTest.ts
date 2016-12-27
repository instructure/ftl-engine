import { assert } from 'chai'
import { Config } from '../src/Config'
import { StatsDMetricReporter } from '../src/lib/'
import { SWF } from 'aws-sdk'
describe('ConfigTest', () => {
  describe('constructor', () => {
    it('should fail when not given a function', () => {
      // fake out ts with the explicit ClassStub
      assert.throws(() => new Config({} as {(): any}))
    })
    it('should fail when given an empty object', () => {
      let userFunc = function() {
        return {}
      }
      assert.throws(() => new Config(userFunc))
    })
    it('should work with passing instances', () => {
      const uc = {
        defaultVersion: '1.0.0',
        swfClient: {},
        swf: {
          domainName: 'mock', workflowName: 'mock',
          domainInstance: {}
        },
        notifier: {
          instance: {}
        },
        logger: {
          instance: {
            info() {},
          }
        },
        metrics: {
          instance: {}
        },
        fieldSerializer: {
          instance: {}
        }
      }
      const c = new Config(() => uc)
      assert.deepEqual(c.swfClient, {})
      assert.deepEqual(c.metricReporter, {})
    })
    it('should work with building instances', () => {
      const uc = {
        defaultVersion: '1.0.0',
        swf: {
          domainName: 'mock', workflowName: 'mock',
        },
        notifier: {
          region: 'us-east-1', snsTopicName: 'mock', awsAccountId: '12345'
        },
        logger: {
          name: 'mock'
        },
        metrics: {
          host: 'fakehost.com',
          port: 9999
        },
        claimCheck: {
          bucket: 'fake'
        }
      }
      const c = new Config(() => uc)
      assert.instanceOf(c.swfClient, SWF)
      assert.instanceOf(c.metricReporter, StatsDMetricReporter)
    })
  })
  describe('checkRequired', () => {
    it('should ensure that required fields are in place', () => {
      assert.doesNotThrow(() => {
        Config.prototype.checkRequired('mock', {foobar: 'string', baz: 'number'}, {foobar: 'what', baz: 1, other: true})
      })
    })
    it('should throw if not of a specific type', () => {
      assert.throws(() => {
        Config.prototype.checkRequired('mock', {foobar: 'string'}, {foobar: 1})
      }, /missing config mock\.foobar/)
    })
    it('should throw if missing', () => {
      assert.throws(() => {
        Config.prototype.checkRequired('mock', {foobar: 'string', bar: 'boolean'}, {foobar: 'a'})
      }, /missing config mock\.bar/)
    })
  })
  describe('getConfigFor', () => {
    it('should work to get a top level key', () => {
      assert.equal(Config.prototype.getConfigFor.call({userConfig: {prop: 'a'}}, 'prop'), 'a')
    })
    it('should work to get a deep key', () => {
      const uc = {
        a: {
          b: {
            c: {
              d: '1'
            }
          }
        },
        k: {
          l: {
            m: '2'
          }
        }
      }
      assert.equal(Config.prototype.getConfigFor.call({userConfig: uc}, 'a.b.c.d'), '1')
    })
  })
  describe('populateUserConfig', () => {
    it('should populate all the defaults but leave existing objects', () => {
      const inConfig = {
        defaultVersion: '1.0.0',
        swf: {
          domainName: 'mock',
          workflowName: 'mock'
        },
        notifier: {
          prop: 'a'
        }
      }
      const outConfig = Config.prototype.populateUserConfig(inConfig)
      assert.deepEqual(outConfig.swf, {domainName: 'mock', workflowName: 'mock'})
      assert.deepEqual(outConfig.notifier, {prop: 'a'})
      assert.deepEqual(outConfig.logger, {})
    })
  })
})
