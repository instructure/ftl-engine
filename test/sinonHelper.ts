import * as sinon from 'sinon'
import * as _ from 'lodash'

export interface ClassStub<T> extends Sinon.SinonStub {
  stubMethod(name: string): Sinon.SinonStub
}
export interface ClassMock<T> extends Sinon.SinonMock {
  object: T
}
export interface ClassSpy<T> extends Sinon.SinonSpy {
  spyMethod(name: string): Sinon.SinonSpy
}

export class SinonHelper implements Sinon.SinonSandbox {
  clock: Sinon.SinonFakeTimers
  requests: Sinon.SinonFakeXMLHttpRequest
  server: Sinon.SinonFakeServer
  spy: Sinon.SinonSpyStatic
  stub: Sinon.SinonStub
  mock: Sinon.SinonMockStatic
  useFakeTimers: Sinon.SinonFakeTimersStatic
  useFakeXMLHttpRequest: Sinon.SinonFakeXMLHttpRequestStatic
  useFakeServer: () => Sinon.SinonFakeServer
  restore: () => void
  stubClass<T>(instanceClass: Function): T & ClassStub<T> {
    let stubbed = this.stub(_.clone(instanceClass.prototype)) as T & ClassStub<T>
    if (typeof stubbed.stubMethod === 'function') throw new Error('have function named stubMethod, conflicts!')
    stubbed.stubMethod = function(name: string): Sinon.SinonStub {
      return stubbed[name] as Sinon.SinonStub
    }
    return stubbed
  }
  mockClass<T>(instanceClass: Function): ClassMock<T> {
    let TmpCons = () => {}
    TmpCons.prototype = instanceClass.prototype
    let inst = new TmpCons
    let mocked = this.mock(inst) as ClassMock<T>
    mocked.object = inst
    return mocked
  }
  spyClass<T>(instanceClass: Function): ClassSpy<T> {
    let spied = this.spy(_.clone(instanceClass.prototype)) as T & ClassSpy<T>
    if (typeof spied.spyMethod === 'function') throw new Error('have function named spyMethod, conflicts!')
    spied.spyMethod = function(name: string): Sinon.SinonSpy {
      return spied[name] as Sinon.SinonSpy
    }
    return spied

  }
}

function newContext(): SinonHelper {
  let sandbox = sinon.sandbox.create()
  let helper = new SinonHelper
  helper = _.extend(helper, sandbox) as SinonHelper

  after(function() {
    sandbox.restore()
  })

  return helper
}

export default newContext
