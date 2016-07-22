import { Config, Logger, FTLActivity, FTLRunCallabck } from '../../src'
export default class Baz extends FTLActivity {
  foo: number
  bar: number
  logger: Logger
  constructor(params: any, env: any, config: Config) {
    super(params, env, config)
    this.foo = env.foo
    this.bar = env.bar
    this.logger = config.logger
  }
  run(cb) {
    setTimeout(() => {
      let res = this.foo * this.bar
      this.logger.info(`baz ran ${res}, ${this.foo}, ${this.bar}`)
      cb(null, {result: res}, {baz: res})
    }, 1000)
  }
  status() {
    return 'baz'
  }
  stop(cb) {
    cb()
  }
  static validateTask(parameters: any): string | null {
    return null
  }
}
