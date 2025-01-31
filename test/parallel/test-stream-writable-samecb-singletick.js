'use strict'

const tap = require('tap')
const silentConsole = {
  log() {},
  error() {}
}
const common = require('../common')
const { Console } = require('console')
const { Writable } = require('../../lib/ours/index')
const async_hooks = require('async_hooks')

// Make sure that repeated calls to silentConsole.log(), and by extension
// stream.write() for the underlying stream, allocate exactly 1 tick object.
// At the time of writing, that is enough to ensure a flat memory profile
// from repeated silentConsole.log() calls, rather than having callbacks pile up
// over time, assuming that data can be written synchronously.
// Refs: https://github.com/nodejs/node/issues/18013
// Refs: https://github.com/nodejs/node/issues/18367

const checkTickCreated = common.mustCall()
const hook = async_hooks
  .createHook({
    init(id, type, triggerId, resoure) {
      if (type === 'TickObject') checkTickCreated()
    }
  })
  .enable()
const console = new Console(
  new Writable({
    write: common.mustCall((chunk, encoding, cb) => {
      cb()
    }, 100)
  })
)
for (let i = 0; i < 100; i++) console.log(i)

/* replacement start */
process.on('beforeExit', (code) => {
  hook.disable()
})
/* replacement end */

/* replacement start */
process.on('beforeExit', (code) => {
  if (code === 0) {
    tap.pass('test succeeded')
  } else {
    tap.fail(`test failed - exited code ${code}`)
  }
})
/* replacement end */
