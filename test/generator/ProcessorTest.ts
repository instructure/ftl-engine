import { assert } from 'chai'

import { Processor } from '../../src/generator/Processor'
import { MetadataStore } from '../../src/generator/MetadataStore'
import { DirState } from '../../src/generator/util'
import { Task, ITaskBuilder} from '../../src/generator/interfaces'

describe('Processor', () => {
  describe('with inline taskBuilder', () => {
    const store = new MetadataStore({})
    const dirInfo: DirState = {files: [], dirs: [], hasIndex: false}
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
})
