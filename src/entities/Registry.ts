import * as path from 'path'
import * as fs from 'fs'
import * as _ from 'lodash'
import { Config } from '../Config'
import { BaseHandler } from './BaseHandler'

export abstract class Registry<T extends BaseHandler>  {
  config: Config
  registry: {[moduleName: string]: T}
  constructor(locations: string[], config: Config) {
    this.config = config
    this.registry = {}
    this.loadModules(locations)
  }
  loadModules(locations: string[]) {
    let activities = _.flatten(locations.map(this.loadLocation.bind(this))) as T[]
    for (let activity of activities) {
      this.registry[activity.getHandlerName()] = activity
    }
  }
  loadLocation(location: string): T[] {
    // handle absolute and relative locations
    if (location.charAt(0) === '.' || location.charAt(0) === '/') {
      return this.loadFile(location)
    }
    this.config.logger.info(`loading module ${location}`)
    return [this.wrapModule(location, require(location))]
  }
  loadFile(location: string): T[] {
    const stat = fs.statSync(location)
    const ext = path.extname(location)
    if (stat.isFile() && ext !== '.js') return []
    if (stat.isFile() && location.slice(-3) === '.js') {
      this.config.logger.info(`loading file ${location}`)
      return [this.wrapModule(location, require(location))]
    }
    if (stat.isDirectory()) {
      this.config.logger.info(`loading directory ${location}`)
      let locations = fs.readdirSync(location).map((l) => path.join(location, l))
      return _.flatten(locations.map(this.loadFile.bind(this))) as T[]
    }
    return []
  }
  getModule(name: string): T | null {
    return this.registry[name]
  }
  getModules(): T[] {
    return _.values<T>(this.registry)
  }
  abstract wrapModule(filename: string, module: any): T
 }
