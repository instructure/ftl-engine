import ScriptTask from '../../src/activities/script'
import { assert } from 'chai'

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
        setInterval(function() {
          console.log('bah')
        }, 40)
        console.log('foo')
      `
      let script = new ScriptTask({script: s, command: 'node', args: ['-e']})
      script.run((err, result) => {
        if (err) throw err
        throw new Error('should not be called')
      })
      script.stop((err, status) => {
        if (err) return done(err)
        assert.match(status, /.*SIGTERM.*/)
        done()
      })
    })
    it('should be able to force kill if it times out', (done) => {
      let s = `
      setInterval(function() {
        console.log('bah')
      }, 40)
      process.on('SIGTERM', function() { console.log('ignore!') })
      `
      let script = new ScriptTask({script: s, command: 'node', args: ['-e']})
      script.run((err, result) => {
        if (err) throw err
        throw new Error('should not be called')
      })
      setTimeout(() => {
        script.stop((err, status) => {
          if (err) return done(err)
          assert.match(status, /.*SIGKILL.*/)
          done()
        })
      }, 100)
    })
  })
})
