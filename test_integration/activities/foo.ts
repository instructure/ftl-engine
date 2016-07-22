import { Config, Logger, FTLActivity, FTLRunCallabck } from '../../src'
export default class Foo extends FTLActivity {

  logger: Logger
  mult: number
  constructor(params: any, env: any, config: Config) {
    super(params, env, config)
    this.mult = params.mult
    this.logger = config.logger
  }
  run(cb: FTLRunCallabck) {
    setTimeout(() => {
      this.logger.info(`foo ran ${this.mult}`)
      cb(null, {hooray: 'yall'}, {foo: Math.round(Math.random() * this.mult)})
    }, 1000)
  }
  status(): any {
    return 'foo'
  }
  stop(cb) {
    cb()
  }
  static validateTask(parameters: any): string | null {
    if (!parameters.mult || !(typeof parameters.mult === 'number')) return 'missing parameter mult or number'
    return null
  }
}
