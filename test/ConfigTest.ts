import { assert } from 'chai'
import { Config } from '../src/Config'
describe('ConfigTest', () => {
  describe('constructor', () => {
    it('should fail when given an empty object', () => {
      let userFunc = function() {
        return {}
      }
      assert.throws(() => new Config(userFunc))
    })
  })
})
