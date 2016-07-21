import * as yargs from 'yargs'
import * as path from 'path'
import * as fs from 'fs'
import { Config } from '../Config'
import { ActivityWorker, DeciderWorker } from '../workers'
import { registration } from '../init'
import { validator } from './validator'

export class Cli {
  config: Config
  activityWorker: ActivityWorker
  deciderWorker: DeciderWorker
  cli: yargs.Argv
  constructor() {
  }
  run(cb: {(Error?)}): yargs.Argv {
    this.cli = yargs
    .usage('Usage: $0 -c <jsConf> <command> [args...]')
    .demand(1)
    .option('config', {
      alias: 'c',
      describe: 'js config module to load',
      demand: true,
      global: true,
      string: true
    })
    .command('submit <input>', 'submit the file (or - for stdin) as an ftl-engine task', {}, this.submit.bind(this, cb))
    .command('start', 'start ftl-engine with specified components', (yargs) => {
      return yargs.option('activity', {
        alias: 'a',
        description: 'start the activty worker',
        default: true,
        boolean: true,
      }).option('decider', {
        alias: 'd',
        description: 'start the decider worker',
        default: true,
        boolean: true,
      }) as any
    }, this.start.bind(this, cb))
    this.cli.argv
    return this.cli
  }
  submit(cb: {(Error?)}, args: any) {
    this.init(args.config, (err, config, workflow, domain, actWorker, decWorker) => {
      if (err) return cb(err)
      const inputFile = args._[0]

      let source = path.join(path.resolve(process.cwd(), inputFile))
      if (inputFile === '-') {
        source = '/dev/stdin'
      }

      let workInput: any | null = null
      try {
        workInput = JSON.parse(fs.readFileSync(source).toString())
      } catch (e) {
        return cb(e)
      }
      if (!workInput) {
        return cb(new Error('invalid work input'))
      }

      const failureReason = validator.validate(config, workInput)
      if (failureReason) {
        config.logger.error('invalid job')
        config.logger.error(failureReason)
        return cb(new Error('invalid job'))
      }

      workflow.startWorkflow(workInput.id, workInput, {}, (err, info) => {
        if (err) return cb(err)
        config.logger.info(info)
        cb()
      })
    })
  }
  start(cb: {(Error?)}, args: any) {
    if (!args.activity || !args.decider) {
      console.log('no workers specified, nothing to do')
      this.cli.showHelp()
      return cb()
    }
    this.init(args.config, (err, workflow, domain, actWorker, decWorker) => {
      if (err) return cb(err)
      this.startWorkers(args, cb)
    })
  }
  init(configFile: string, cb: {(Error?, Config?, Workflow?, Domain?, ActivityWorker?, DeciderWorker?)}) {
    const configFunc = require(path.join(process.cwd(), configFile))
    const config = new Config(configFunc)
    this.config = config
    registration.init(config, (err, workflow, domain, actWorker, decWorker) => {
      if (err) return cb(err)
      this.activityWorker = actWorker
      this.deciderWorker = decWorker
      cb(null, config, workflow, domain, actWorker, decWorker)
    })
  }
  startWorkers(args: any, cb: {(Error?)}) {
    let workerStates = {
      activity: true,
      decider: true,
    }
    let cbCalled = false
    function toStop(worker: ActivityWorker | DeciderWorker, name: 'activity' | 'decider', cb: {(Error?)}) {
      worker.on('error', (err) => {
        this.config.logger.error(`error from ${name} worker`, err)
      })
      process.on('SIGINT', () => {
        worker.stop((err) => {
          if (err) return cb(err)
          workerStates[name] = true
          this.config.logger.info(`stopped ${name} worker`)
          if (workerStates.activity && workerStates.decider && !cbCalled) {
            cbCalled = true
            return cb()
          }
        })
      })
    }
    if (args.activity) {
      workerStates.activity = false
      toStop.call(this, this.activityWorker, 'activity', cb)
    }
    if (args.decider) {
      workerStates.decider = false
      toStop.call(this, this.deciderWorker, 'decider', cb)
    }
    this.startActivityWorker(args.activity, (err) => {
      if (err) return cb(err)
      this.startDeciderWorker(args.decider, (err) => {
        if (err) return cb(err)
        this.config.logger.info('started workers')
      })
    })
  }
  startActivityWorker(shouldStart: boolean, cb: {(err: Error | null, s: boolean)}) {
    if (!shouldStart) return cb(null, false)
    this.activityWorker.start((err) => {
      if (err) return cb(err, false)
      this.config.logger.info('started activity worker')
      cb(null, true)
    })
  }
  startDeciderWorker(shouldStart: boolean, cb: {(err: Error | null, s: boolean)}) {
    if (!shouldStart) return cb(null, false)
    this.deciderWorker.start((err) => {
      if (err) return cb(err, false)
      this.config.logger.info('started decider worker')
      cb(null, true)
    })
  }
}
