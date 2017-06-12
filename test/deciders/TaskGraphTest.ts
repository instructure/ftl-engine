import { assert } from 'chai'
import * as shortId from 'shortid'

import { Workflow } from 'simple-swf/build/src/entities'
import { DecisionTask, EventData, EventRollup } from 'simple-swf/build/src/tasks'

import { default as newContext, SinonHelper, ClassMock } from '../sinonHelper'
import { Config } from '../../src/Config'
import { Logger } from '../../src/lib'
import { ActivityRegistry, ActivityType } from '../../src/entities'
import { default as TaskGraph, TaskGraphParameters, TaskGraphNode, TaskGraphGraph } from '../../src/deciders/TaskGraph'

interface getModuleStub {(name: string): ActivityType | null}

function buildBaseMock(sandbox: SinonHelper, getModuleFunc?: getModuleStub): {wf: Workflow, c: Config} {
  let wf = sandbox.stubClass<Workflow>(Workflow)
  let config = sandbox.stubClass<Config>(Config)
  config.logger = sandbox.stubClass<Logger>(Logger)
  config.getOpt = function(name) {
    return 50
  }
  let mockRegistry = sandbox.stubClass<ActivityRegistry>(ActivityRegistry)
  mockRegistry.getModule = getModuleFunc || function(moduleName: string): ActivityType {
    return sandbox.stubClass<ActivityType>(ActivityType)
  }
  config.activities = mockRegistry
  return {wf, c: config}
}

// little method to help build up mock input and
function buildNextMock(nodes, sandbox: SinonHelper, getModuleFunc?: getModuleStub):
  {tg: TaskGraph, dt: DecisionTask, input: TaskGraphParameters} {
  let grouped = {
    activity: {},
    workflow: {},
    decision: {},
    signals: {},
    marker: {}
  } as EventData
  let graph = {
    nodes: {},
    edges: {},
    sourceNode: '',
    sinkNode: ''
  } as TaskGraphGraph
  for (let node of nodes) {
    node.handler = node.handler || 'mock'
    node.id = node.id + '' || shortId.generate()
    node.type = node.type || 'activity'
    let groupName: string | null = null
    if (node.handler === 'recordMarker') {
      groupName = 'marker'
    } else if (node.type === 'decision') {
      groupName = 'workflow'
    }
    node.deps = node.deps || []
    graph.nodes[node.id] = node
    if (node.source) graph.sourceNode = node.id
    if (node.sink) graph.sinkNode = node.id
    if (node.done) node.state = 'completed'
    // if it has a state, assume it would be somewhere in the history already
    if (node.state) {
      grouped[groupName || node.type][node.id] = {
        current: node.state,
        // mock it out for now, eventually we probably want to popualte it with semi real info
        [node.state]: {
          mock: true
        }
      }
    }
    graph.edges[node.id] = node.deps.map((d) => d + '')
  }
  if (!graph.sinkNode || !graph.sourceNode) {
    throw new Error('must assign one node each to be source and sink')
  }

  let dt = sandbox.stubClass<DecisionTask>(DecisionTask)
  dt.getGroupedEvents = () => grouped

  let baseMock = buildBaseMock(sandbox, getModuleFunc)
  let tg = new TaskGraph(baseMock.c, baseMock.wf)
  return {tg, dt, input: {graph: graph} as TaskGraphParameters}
}

function buildDecideMock(sandbox: SinonHelper, nextNodesRet): {tg: TaskGraph, dt: ClassMock<DecisionTask>, mg: TaskGraphParameters} {
  let baseMock = buildBaseMock(sandbox)
  let dt = sandbox.mockClass<DecisionTask>(DecisionTask)
  // do a bit of hackery to access the 'private' properties
  let setDefaultRollup = dt.object as any
  setDefaultRollup.rollup = sandbox.stubClass<EventRollup>(EventRollup)
  setDefaultRollup.rollup.getFailedEvents = () => ({activity: [], workflow: []})
  setDefaultRollup.rollup.getTimedOutEvents = () => ({activity: [], workflow: []})
  setDefaultRollup.rollup.getRetryableFailedToScheduleEvents = () => ({activity: [], workflow: []})
  dt.object.getGroupedEvents = () => ({activity: {}, workflow: {}, completed: []})
  let tg = new TaskGraph(baseMock.c, baseMock.wf)
  tg.getNextNodes = function() {
    return nextNodesRet
  }
  return {tg, dt, mg: {graph: {edges: {}, nodes:{}} as TaskGraphGraph}}
}


describe('taskGraph', () => {

  describe('#decide()', () => {
    it('should call scheduleTask with any activity tasks', () => {
      let getNext = {finished: false, nodes: [{id: 1, handler: 'mock'}]}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)

      dt.expects('scheduleTask').once()
      dt.expects('completeWorkflow').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('should call completeWorkflow when finished', function() {
      let getNext = {finished: true, nodes: []}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('completeWorkflow').once()
      dt.expects('scheduleTask').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('should call recordMarker when receiving a marker task', function() {
      let getNext = {finished: false, nodes: [{id: 1, type: 'decision', handler: 'recordMarker', parameters: {status: ''}}]}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('addMarker').once()
      dt.expects('completeWorkflow').never()
      dt.expects('scheduleTask').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('should call startChildWorkflow when receiving a task graph task', function() {
      let getNext = {finished: false, nodes: [{id: 1, type: 'decision', handler: 'taskGraph'}]}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('startChildWorkflow').once()
      dt.expects('addMarker').never()
      dt.expects('completeWorkflow').never()
      dt.expects('scheduleTask').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('should call multiple times for diffent decisions and finish', function() {
      let getNext = {finished: true, nodes: [
          {id: 1, type: 'decision', handler: 'taskGraph'},
          {id: 2, type: 'decision', handler: 'recordMarker', parameters: {status: ''}},
          {id: 3, handler: 'mock'},
          {id: 4, handler: 'mock'}
        ]
      }

      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('startChildWorkflow').once()
      dt.expects('addMarker').once()
      dt.expects('completeWorkflow').once()
      dt.expects('scheduleTask').twice()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('should fail the workflow if we fail to reschedule failed tasks', function() {
      let getNext = {finished: true, nodes: []}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('rescheduleFailedEvents').once().returns([{failed: true}])
      dt.expects('failWorkflow').once()
      dt.expects('completeWorkflow').never()

      tg.decide(mg, dt.object)
      dt.verify()

    })
    it('should fail the workflow if we fail to reschedule timedOut tasks', function() {
      let getNext = {finished: true, nodes: []}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('rescheduleFailedToSchedule').once().returns([{failed: true}])
      dt.expects('failWorkflow').once()
      dt.expects('completeWorkflow').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('should fail the workflow if we fail the reschedule reryable tasks', function() {
      let getNext = {finished: true, nodes: []}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('rescheduleTimedOutEvents').once().returns([{failed: true}])
      dt.expects('failWorkflow').once()
      dt.expects('completeWorkflow').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
    it('it should only schedule up to 50 workflows at once', function() {
      let retNodes: any = []
      for (let i = 0; i < 110; i++) {
        retNodes.push({
          id: i,
          type: 'decision',
          handler: 'taskGraph'
        })
      }
      let getNext = {finished: false, nodes: retNodes}
      let {tg, dt, mg} = buildDecideMock(newContext(), getNext)
      dt.expects('startChildWorkflow').exactly(50)
      dt.expects('completeWorkflow').never()

      tg.decide(mg, dt.object)
      dt.verify()
    })
  })
  describe('#getNextNodes()', () => {
    describe('simple linear dependency', () => {
      let nodes = [
        {
          id: 1,
          source: true,
          done: true
        },
        {
          id: 2,
          deps: [1]
        },
        {
          id: 3,
          deps: [2],
          sink: true
        }
      ]
      let {dt, input, tg} = buildNextMock(nodes, newContext())
      let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
      it('should schedule only the node that is ready', () => {
        assert.equal(nextNodes.nodes.length, 1)
        assert.equal(nextNodes.nodes[0].handler, 'mock')
        assert.equal(nextNodes.nodes[0].id as any, 2)
      })
    })
    describe('many children', () => {
      let nodes = [
        {
          id: 1,
          source: true,
          done: true
        },
        {
          id: 2,
          deps: [1]
        },
        {
          id: 3,
          deps: [1]
        },
        {
          id: 4,
          deps: [1]
        },
        {
          id: 5,
          deps: [2, 3, 4],
          sink: true
        }
      ]
      let {dt, input, tg} = buildNextMock(nodes, newContext())
      let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
      it('should schedule multiple children that are ready', () => {
        assert.equal(nextNodes.nodes.length, 3)
        assert.equal(nextNodes.nodes[0].handler, 'mock')
        assert.equal(nextNodes.nodes[1].handler, 'mock')
        assert.equal(nextNodes.nodes[2].handler, 'mock')
        assert.equal(nextNodes.nodes[0].id as any, 2)
        assert.equal(nextNodes.nodes[1].id as any, 3)
        assert.equal(nextNodes.nodes[2].id as any, 4)
      })
    })
    describe('depend on multiple parents', () => {
      it('should only schedule if both parents are ready', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1],
            done: true
          },
          {
            id: 3,
            deps: [1],
            done: true
          },
          {
            id: 4,
            deps: [2, 3]
          },
          {
            id: 5,
            deps: [4],
            sink: true
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.nodes.length, 1)
        assert.equal(nextNodes.nodes[0].handler, 'mock')
        assert.equal(nextNodes.nodes[0].id as any, 4)
      })
      it('should not schedule if both parents are not ready', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1],
            done: true
          },
          {
            id: 3,
            deps: [1]
          },
          {
            id: 4,
            deps: [2, 3]
          },
          {
            id: 5,
            deps: [4],
            sink: true
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.nodes.length, 1)
        assert.equal(nextNodes.nodes[0].handler, 'mock')
        assert.equal(nextNodes.nodes[0].id as any, 3)
      })
    })
    describe('first decision', () => {
      it('should add recordMarker and first activities', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            type: 'decision',
            handler: 'recordMarker',
            parameters: {
              status: 'stuff'
            }
          },
          {
            id: 2,
            deps: [1]
          },
          {
            id: 3,
            deps: [1]
          },
          {
            id: 4,
            deps: [2, 3]
          },
          {
            id: 5,
            deps: [4],
            sink: true
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.nodes.length, 3)
        assert.equal(nextNodes.nodes[0].handler, 'recordMarker')
        assert.equal(nextNodes.nodes[0].id as any, 1)
        assert.equal(nextNodes.nodes[1].handler, 'mock')
        assert.equal(nextNodes.nodes[1].id as any, 2)
        assert.equal(nextNodes.nodes[2].handler, 'mock')
        assert.equal(nextNodes.nodes[2].id as any, 3)
      })
    })
    describe('record marker', () => {
      it('should not add last recordMarker if all parents are not done', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1]
          },
          {
            id: 3,
            deps: [1]
          },
          {
            id: 4,
            deps: [2, 3],
            sink: true,
            type: 'decision',
            handler: 'recordMarker',
            parameters: {
              status: 'stuff'
            }
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.nodes.length, 2)
        assert.equal(nextNodes.nodes[0].handler, 'mock')
        assert.equal(nextNodes.nodes[0].id as any, 2)
        assert.equal(nextNodes.nodes[1].handler, 'mock')
        assert.equal(nextNodes.nodes[1].id as any, 3)
      })
      it('should add recordMarker if all parents are done or markers', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1],
            done: true
          },
          {
            id: 3,
            deps: [1],
            type: 'decision',
            handler: 'recordMarker',
            parameters: {
              status: 'stuff'
            }
          },
          {
            id: 4,
            deps: [2, 3],
            sink: true,
            type: 'decision',
            handler: 'recordMarker',
            parameters: {
              status: 'stuff'
            }
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.finished, true)
        assert.equal(nextNodes.nodes.length, 2)
        assert.equal(nextNodes.nodes[0].handler, 'recordMarker')
        assert.equal(nextNodes.nodes[0].id, '3')
        assert.equal(nextNodes.nodes[1].handler, 'recordMarker')
      })
    })
    describe('finished', () => {
      it('should mark the workflow complete', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1],
            done: true
          },
          {
            id: 3,
            deps: [1],
            done: true
          },
          {
            id: 4,
            deps: [2, 3],
            done: true
          },
          {
            id: 5,
            deps: [4],
            sink: true,
            done: true
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.finished, true)
        assert.equal(nextNodes.nodes.length, 0)
      })
    })
    describe('nothing to schedule', () => {
      it('should not be able to schedule if tasks are running or scheduled', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1],
            state: 'scheduled'
          },
          {
            id: 3,
            deps: [1],
            state: 'started'
          },
          {
            id: 4,
            deps: [2, 3]
          },
          {
            id: 5,
            deps: [4],
            sink: true
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.nodes.length, 0)
      })
    })
    describe('child workflows', () => {
      it('should be able to schedule child workflows', () => {
        let nodes = [
          {
            id: 1,
            source: true,
            done: true
          },
          {
            id: 2,
            deps: [1],
            type: 'decision',
            handler: 'taskGraph'
          },
          {
            id: 3,
            deps: [1],
            done: true
          },
          {
            id: 4,
            deps: [2, 3]
          },
          {
            id: 5,
            deps: [4],
            sink: true
          }
        ]
        let {dt, input, tg} = buildNextMock(nodes, newContext())
        let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
        assert.equal(nextNodes.nodes.length, 1)
        assert.equal(nextNodes.nodes[0].handler, 'taskGraph')
      })
    })
  })
  describe('#getNodeDetails()', () => {
    let nodes = [
      {
        id: 1,
        source: true,
        done: true
      },
      {
        id: 2,
        deps: [1],
        state: 'started'
      },
      {
        id: 3,
        deps: [2]
      },
      {
        id: 4,
        deps: [3],
        type: 'decision',
        done: true,
        handler: 'taskGraph'
      },
      {
        id: 5,
        deps: [4],
        type: 'decision',
        handler: 'taskGraph'
      },
      {
        id: 6,
        deps: [5],
        type: 'decision',
        handler: 'recordMarker',
        done: true,
        parameters: {
          status: 'stuff'
        }
      },
      {
        id: 7,
        deps: [6],
        sink: true,
        type: 'decision',
        handler: 'recordMarker',
        parameters: {
          status: 'stuff'
        }
      }
    ]

    let {dt, input, tg} = buildNextMock(nodes, newContext())
    let nextNodes = tg.getNextNodes(input.graph, dt.getGroupedEvents())
    let graph = input.graph
    let grouped = dt.getGroupedEvents()
    it('should handle a normal node that is finished', () => {
      let res = tg.getNodeDetails(graph, grouped, '1')
      assert.equal(res.state, 'completed')
      assert.equal(res.type, 'activity')
      assert.equal(res.id, '1')
      assert.deepEqual(res.deps, [])
    })
    it('should handle a normal node that has a specific state', () => {
      let res = tg.getNodeDetails(graph, grouped, '2')
      assert.equal(res.state, 'started')
      assert.equal(res.type, 'activity')
      assert.equal(res.id, '2')
      assert.deepEqual(res.deps, ['1'])
    })
    it('should handle a normal node that has not started', () => {
      let res = tg.getNodeDetails(graph, grouped, '3')
      assert.equal(res.state, 'waiting')
      assert.equal(res.type, 'activity')
      assert.equal(res.id, '3')
      assert.deepEqual(res.deps, ['2'])
    })
    it('should handle a decision node that has finished', () => {
      let res = tg.getNodeDetails(graph, grouped, '4')
      assert.equal(res.state, 'completed')
      assert.equal(res.type, 'workflow')
      assert.equal(res.id, '4')
      assert.deepEqual(res.deps, ['3'])
    })
    it('should handle a decision node that has not finished', () => {
      let res = tg.getNodeDetails(graph, grouped, '5')
      assert.equal(res.state, 'waiting')
      assert.equal(res.type, 'workflow')
      assert.equal(res.id, '5')
      assert.deepEqual(res.deps, ['4'])
    })
    it('should handle a add marker node that has finished', () => {
      let res = tg.getNodeDetails(graph, grouped, '6')
      assert.equal(res.state, 'completed')
      assert.equal(res.type, 'marker')
      assert.equal(res.id, '6')
      assert.deepEqual(res.deps, ['5'])
    })
    it('should handle a add marker node that has not finished', () => {
      let res = tg.getNodeDetails(graph, grouped, '7')
      assert.equal(res.state, 'collapse')
      assert.equal(res.type, 'marker')
      assert.equal(res.id, '7')
      assert.deepEqual(res.deps, ['6'])
    })
  })
  describe('#throttle', () => {
    let nodes = [
      {
        id: 1,
        source: true,
        done: true
      },
      {
        id: 2,
        deps: [1],
        handler: 'oneLimit',
        state: 'started'
      },
      {
        id: 3,
        deps: [1],
        handler: 'oneLimit'
      },
      {
        id: 4,
        deps: [1],
        handler: 'twoLimit',
        state: 'started'
      },
      {
        id: 5,
        deps: [1],
        handler: 'twoLimit'
      },
      {
        id: 6,
        deps: [1],
        handler: 'twoLimit'
      },
      {
        id: 7,
        deps: [1],
        handler: 'noLimit',
        state: 'started'
      },
      {
        id: 8,
        deps: [1],
        handler: 'noLimit'
      },
      {
        id: 9,
        deps: [1],
        handler: 'noLimit'
      },
      {
        id: 10,
        deps: [2, 3, 4, 5, 6, 7, 8, 9],
        sink: true
      }
    ]

    let sandbox = newContext()
    function multiModule(name): ActivityType | null{
      let actOne = sandbox.stubClass<ActivityType>(ActivityType)
      actOne.getMaxConcurrent = () => 1
      let actTwo = sandbox.stubClass<ActivityType>(ActivityType)
      actTwo.getMaxConcurrent = () => 2
      if (name === 'oneLimit') return actOne
      if (name === 'twoLimit') return actTwo
      let noLimit = sandbox.stubClass<ActivityType>(ActivityType)
      actTwo.getMaxConcurrent = () => null
      return noLimit
    }
    let {dt, input, tg} = buildNextMock(nodes, sandbox, multiModule)
    let graph = input.graph
    let grouped = dt.getGroupedEvents()
    it('should throttle if we have more activities running concurrently', () => {
      let nextNodes = tg.getNextNodes(graph, grouped)
      assert.equal(nextNodes.nodes.length, 5)
      let startOfType = {oneLimit: 0, twoLimit: 0, noLimit: 0}
      for (let next of nextNodes.nodes) {
        let t = tg.throttle(next, graph, grouped, startOfType)
        if (!t) {
          startOfType[next.handler]++
        }
      }
      assert.equal(startOfType.oneLimit, 0)
      assert.equal(startOfType.twoLimit, 1)
      assert.equal(startOfType.noLimit, 2)
    })
  })
  describe('#throttleWorkflows', () => {
    let nodes = [
      {
        id: 1,
        source: true,
        done: true
      },
      {
        id: 2,
        deps: [1],
        type: 'decision',
        handler: 'taskGraph',
        state: 'started'
      },
      {
        id: 3,
        deps: [1],
        type: 'decision',
        handler: 'taskGraph'
      },
      {
        id: 4,
        deps: [1],
        type: 'decision',
        handler: 'taskGraph'
      },
      {
        id: 5,
        deps: [1],
        type: 'decision',
        handler: 'taskGraph'
      },
      {
        id: 6,
        deps: [2, 3, 4, 5],
        sink: true
      }
    ]

    let {dt, input, tg} = buildNextMock(nodes, newContext())
    let graph = input.graph
    let grouped = dt.getGroupedEvents()
    it('should throttle if we have more activities running concurrently', () => {
      let nextNodes = tg.getNextNodes(graph, grouped)
      assert.equal(nextNodes.nodes.length, 3)
      let startCount = 0
      for (let next of nextNodes.nodes) {
        let t = tg.throttleWorkflows(next, graph, grouped, startCount, 3)
        if (!t) {
          startCount++
        }
      }
      assert.equal(startCount, 2)
    })
  })
})
