'use strict'
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

// `node --harmony examples/simple.js`

const Toa = require('toa')
const Router = require('..')

const router = new Router()
router
  .get('/:name', function () { // sync handler
    this.body = `${this.method} /${this.params.name}`
  })
  .get('/thunk', function (done) { // thunk handler
    this.body = 'thunk handler'
    done()
  })
  .get('/generator', function * () { // generator handler
    this.body = yield Promise.resolve('generator handler')
  })
  .get('/async', async function () { // async/await handler in Node.js v7
    this.body = await Promise.resolve('async/await handler')
  })
  .otherwise(function () {
    this.throw(404)
  })

router.define('/user/:id([0-9]+)')
  .get(function () {
    this.body = 'Read from:' + this.method + ' ' + this.path
  })
  .post(function () {
    this.body = 'Add to:' + this.method + ' ' + this.path
  })

const app = new Toa()
app.use(router.toThunk())
app.listen(3000, () => console.log('Listened 3000'))
