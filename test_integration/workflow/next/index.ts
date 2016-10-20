import {Processor, MetadataStore} from '../../../src/generator'
import * as path from 'path'

export default function(ProcClass: typeof Processor): typeof Processor {
  return class LinkProc extends ProcClass {
    static getStartDir(dir: string, store: MetadataStore, cb:{(err?: Error | null, d?: string | null)}) {
      cb(null, path.resolve(__dirname, '../../workflow_link'))
    }
  }
}
