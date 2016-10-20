import { assert } from 'chai'
import * as path from 'path'

import { Processor } from '../../src/generator/Processor'
import { MetadataStore } from '../../src/generator/MetadataStore'
import { DirState } from '../../src/generator/util'
import { Task, ITaskBuilder} from '../../src/generator/interfaces'

describe('Processor', () => {
  describe('with inline taskBuilder', () => {
    const store = new MetadataStore({})
    const dirInfo: DirState = {files: [], dirs: []}
    const processor = new Processor(store, "", dirInfo.files, dirInfo.dirs)
    const task = {} as Task
    it('should include maxRetry if present', (done) => {
      const taskBuilder = {
        create({}, {}){
          return task
        },
        maxRetry: 525
      } as ITaskBuilder
      let newTask = processor.wrapTask({}, "UnitTest", task, taskBuilder )
      assert.equal(newTask.maxRetry, 525)
      done()
    })
    it('should NOT include maxRetry if not provided', (done) => {
      const taskBuilder = {
        create({}, {}){
          return task
        }
      } as ITaskBuilder
      let newTask = processor.wrapTask({}, "UnitTest", task, taskBuilder )
      assert.equal(newTask.maxRetry, null)
      done()
    })
  })
  describe('getStartDir', () => {
    const store = new MetadataStore({})
    it('should return the dir passed to it', (done) => {
      Processor.getStartDir('somePath/toHere', store, (err, newDir) => {
        assert.ifError(err)
        assert.equal(newDir, 'somePath/toHere')
        done()
      })
    })
  })
  describe('readDirectory', () => {
    const store = new MetadataStore({})
    it('should read a directries contents, filter for js files', (done) => {
      // just read our test_integration directory
      Processor.readDirectory(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        assert.deepEqual(info!.files, ['bar.js', 'baz.js', 'foo.js'])
        assert.deepEqual(info!.dirs, ['next'])
        done()
      })
    })
  })
  describe('filterToProcess', () => {
    it('should work to remove files', (done) => {
      // just read our test_integration directory
      const store = new MetadataStore({}, {exclude: [/ba.*/]})
      Processor.readDirectory(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        Processor.filterToProcess(info!, store, (err, filtered) => {
          assert.ifError(err)
          assert.deepEqual(filtered!.files, ['foo.js'])
          assert.deepEqual(filtered!.dirs, ['next'])
        })
        done()
      })
    })
    it('should work to remove folders', (done) => {
      // just read our test_integration directory
      const store = new MetadataStore({}, {exclude: [/next/]})
      Processor.readDirectory(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        Processor.filterToProcess(info!, store, (err, filtered) => {
          assert.ifError(err)
          assert.deepEqual(filtered!.files, ['bar.js', 'baz.js', 'foo.js'])
          assert.deepEqual(filtered!.dirs, [])
        })
        done()
      })
    })
    it('should work to only include certain files', (done) => {
      const store = new MetadataStore({}, {include: [/ba.*/]})
      Processor.readDirectory(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        Processor.filterToProcess(info!, store, (err, filtered) => {
          assert.ifError(err)
          assert.deepEqual(filtered!.files, ['bar.js', 'baz.js'])
          assert.deepEqual(filtered!.dirs, [])
        })
        done()
      })
    })
    it('should work to have mutliple things', (done) => {
      const store = new MetadataStore({}, {include: [/ba.*/, /next/]})
      Processor.readDirectory(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        Processor.filterToProcess(info!, store, (err, filtered) => {
          assert.ifError(err)
          assert.deepEqual(filtered!.files, ['bar.js', 'baz.js'])
          assert.deepEqual(filtered!.dirs, ['next'])
        })
        done()
      })
    })
    it('should work to include and exclude', (done) => {
      const store = new MetadataStore({}, {include: [/ba.*/], exclude: [/bar\.js/]})
      Processor.readDirectory(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        Processor.filterToProcess(info!, store, (err, filtered) => {
          assert.ifError(err)
          assert.deepEqual(filtered!.files, ['baz.js'])
          assert.deepEqual(filtered!.dirs, [])
        })
        done()
      })
    })
  })
  describe('getToProcess', () => {
    it('should work to get everything we expect to process', (done) => {
      const store = new MetadataStore({})
      Processor.getToProcess(path.resolve(__dirname, '../../test_integration/workflow'), store, (err, info) => {
        assert.ifError(err)
        assert.deepEqual(info!.files, ['bar.js', 'baz.js', 'foo.js'])
        assert.deepEqual(info!.dirs, ['next'])
        done()
      })
    })
  })
  describe('process', () => {
    it('should build a full graph', (done) => {
      const store = new MetadataStore({})
      const startDir = path.resolve(__dirname, '../../test_integration/workflow')
      Processor.getToProcess(startDir, store, (err, info) => {
        assert.ifError(err)
        const proc = new Processor(store, startDir, info!.files, info!.dirs)
        proc.process({}, (err, output) => {
          assert.ifError(err)
          // small sanity tests on teh graph
          const g = output!.parameters.graph
          // taskWorkflow + 1 folder + 2 markers
          assert.equal(Object.keys(g.nodes).length, 4)
          done()
        })
      })
    })
  })
})
