import { Config, Logger, FTLActivity, FTLRunCallabck } from '../../src'
export default class Bar extends FTLActivity {

  logger: Logger
  foo: number
  constructor(params: any, env: any, config: Config) {
    super(params, env, config)
    this.foo = env.foo
    this.logger = config.logger
  }
  run(cb: FTLRunCallabck) {
    setTimeout(() => {
      this.logger.info('bar ran')
      cb(null, {result: this.foo}, {bar: Math.round(Math.random() * -100)})
    }, 1000)
  }
  status(): any {
    return 'bar'
  }
  stop(cb) {
    cb()

  }
  static validateTask(parameters: any): string | null {
    return null
  }
}
