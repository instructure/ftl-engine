import ScriptTask from '../../src/activities/script'
import { assert } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

function writeAndBuild(name, script, cb) {
  const fp = path.join(__dirname, `${name}.sh`)
  fs.writeFile(fp, script, {mode: 0o766}, (err) => {
    if (err) return cb(err)
    cb(null, fp, (d) => fs.unlink(fp, d))
  })
}
describe('Script', () => {
  describe('with text script', () => {
    it('should execute a simple script with a shebang', (done) => {
      let s = `
      #!/bin/bash

      echo 'hello'
      sleep 0.01
      `
      let script = new ScriptTask({script: s})
      script.run((err, result) => {
        if (err) return done(err)
        assert.match(result.stdout, /hello.*/)
        done()
      })
    })
    it('should execute a simple script that is just a line', (done) => {
      let script = new ScriptTask({script: 'echo hello'})
      script.run((err, result) => {
        if (err) return done(err)
        assert.match(result.stdout, /hello.*/)
        done()
      })
    })
    it('should pass an error if a bad exit code', (done) => {
      let script = new ScriptTask({script: 'false'})
      script.run((err, result) => {
        assert.instanceOf(err, Error)
        assert.match(err!.message, /script exited with non-zero exit code.*/)
        done()
      })
    })
    it('should be able to be killed', (done) => {
      let s = `
      #!/bin/bash
      echo "foo"
      while true; do
        sleep 0.1
        echo "bah"
      done
      `
      writeAndBuild('long', s, (err, fullPath, onDone) => {
        if (err) throw err
        let script = new ScriptTask({script: fullPath, command: 'sh', args: ['-c']})
        script.run((err, result) => {
          if (err) throw err
          throw new Error('should not be called')
        })
        setTimeout(() => {
          script.stop((err, status) => {
            if (err) return done(err)
            assert.match(status, /.*SIGTERM.*/)
            onDone(done)
          })
        }, 150)
      })
    })
    it('should be able to force kill if it times out', (done) => {
      let s = `
      #!/bin/bash
      trap "echo ignore!" SIGTERM
      while true; do
        sleep 0.1
        echo "bah"
      done
      `
      writeAndBuild('sigterm', s, (err, fullPath, onDone) => {
        if (err) throw err
        let script = new ScriptTask({script: fullPath, command: 'sh', args: ['-c']})
        script.run((err, result) => {
          if (err) throw err
          throw new Error('should not be called')
        })
        setTimeout(() => {
          script.stop((err, status) => {
            if (err) return done(err)
            assert.match(status, /.*SIGKILL.*/)
            onDone(done)
          })
        }, 150)
      })
    })
  })
})
