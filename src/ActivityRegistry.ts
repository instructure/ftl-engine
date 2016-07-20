import * as path from 'path'
import * as fs from 'fs'
import * as _ from 'lodash'
import { ActivityType } from './ActivityType'
import { FTLActivity } from './BaseActivity'
import { Config } from './Config'
export class ActivityRegistry {
  config: Config
  activities: {[name: string]: ActivityType}
  constructor(locations: string[], config: Config) {
    this.activities = {}
    this.config = config
    this.loadActivities(locations)
  }
  loadActivities(locations: string[]) {
    let activities = _.flatten(locations.map(this.loadLocation))
    for (let activity of activities) {
      this.activities[activity.getHandlerName()] = activity
    }
  }
  loadLocation(location: string): ActivityType[] {
    // handle absolute and relative locations
    if (location.charAt(0) === '.' || location.charAt(0) === '/') {
      return this.loadFile(location);
    }
    return [this.wrapActivityHandler(location, require(location))]
  }
  loadFile(location: string): ActivityType[] {
    let stat = fs.statSync(location)
    if (stat.isFile && location.slice(-3) === '.js') {
      return [this.wrapActivityHandler(location, require(location))]
    }
    if (stat.isDirectory) {
      let locations = fs.readdirSync(location)
      return _.flatten(locations.map(this.loadFile))
    }
    return []
  }
  wrapActivityHandler(filename: string, handler: typeof FTLActivity): ActivityType {
    if (typeof handler !== 'function') throw new Error(`activity module ${filename} doesn't export single class function`)

    handler.getHandlerName = handler.getHandlerName || function(): string {
      // for some reason, typescript doesn't recognize handler.constructor.name, so do this as a hack
      let construct = handler.constructor as any
      return construct.name || path.basename(filename, path.extname(filename))
    }
    const name = handler.getHandlerName()
    if (!handler.validateTask)
        throw new Error(`activity module ${name} does not have a static validateTask function`)
    if (!handler.prototype.run)
        throw new Error(`activity module ${name} does not implement a run method`)
    if (!handler.prototype.status)
        throw new Error(`activity module ${name} does not implement a status method`)
    if (!handler.prototype.stop)
        throw new Error(`activity module ${name} does not implement a stop method`)
    return new ActivityType(handler, filename, this.config)
  }
  getModule(name: string): ActivityType | null {
    return this.activities[name]
  }
}
