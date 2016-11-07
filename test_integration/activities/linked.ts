import { Config, Logger, FTLActivity, FTLRunCallabck } from '../../src'
export default class Bar extends FTLActivity {

  logger: Logger
  constructor(params: any, env: any, config: Config) {
    super(params, env, config)
    this.logger = config.logger
  }
  run(cb: FTLRunCallabck) {
    setTimeout(() => {
      this.logger.info('the linked activity ran')
      cb(null)
    }, 1000)
  }
  status(): any {
    return 'linked'
  }
  stop(cb) {
    cb()
  }
  static validateTask(parameters: any): string | null {
    return null
  }
}
