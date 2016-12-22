
import { assert } from 'chai'

import { default as newContext, SinonHelper, ClassMock } from '../../sinonHelper'
import { BaseDecider} from '../../../src/entities/decider'
import { Config } from '../../../src/Config'
import { Workflow} from 'simple-swf/build/src/entities'

describe('BaseDecider', () => {
  let sandbox = newContext()
  let config = sandbox.stubClass<Config>(Config)
  let workflow = sandbox.stubClass<Workflow>(Workflow)
  it('should throw an error on all methods', () => {
    const decider = new BaseDecider(config, workflow)
    assert.throws(decider.makeDecisions.bind(decider))
    assert.throws(BaseDecider.validateTask.bind(BaseDecider, {}))
    assert.throws(BaseDecider.getChildren.bind(BaseDecider, {}))
    assert.equal(BaseDecider.getHandlerName(), '')
  })
})
