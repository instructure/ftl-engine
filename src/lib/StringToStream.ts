import { Readable } from 'stream'

export class StringToStream extends Readable {
  ended: boolean
  constructor(private str) {
    super()
  }
  _read(size: number) {
    if (!this.ended) {
      process.nextTick(() => {
        this.push(new Buffer(this.str))
        this.push(null)
      })
      this.ended = true
    }
  }
}
