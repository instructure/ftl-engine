import {Logger} from '../../src/lib/Logger'

export default class MockLogger extends Logger {

  constructor() {
    super({name: 'mock'})
  }
  debug(msg: string, meta?: Object) {
  }
  info(msg: string, meta?: Object) {
  }
  warn(msg: string, meta?: Object) {
  }
  error(msg: string, meta?: Object) {
  }
  fatal(msg: string, meta?: Object) {
  }
}
