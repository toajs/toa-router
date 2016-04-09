'use strict'
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT
var Toa = require('toa')
var Router = require('..')

var router = new Router()

router
  .get('', function () {
    // sync handle
    this.body = this.method + ' ' + this.path
  })
  .get('/promise', function () {
    // promise handle
    var ctx = this
    return Promise.resolve().then(function () {
      ctx.body = ctx.method + ' ' + ctx.path
    })
  })
  .get('/thunk', function () {
    // thunk handle
    return function (done) {
      this.body = this.method + ' ' + this.path
      done()
    }
  })
  .get('/generator', function *() {
    // generator handle
    this.body = this.method + ' ' + this.path
  })

router
  .define('/user/:id([0-9]+)')
  .get(function () {
    this.body = 'Read from:' + this.method + ' ' + this.path
  })
  .post(function () {
    this.body = 'Add to:' + this.method + ' ' + this.path
  })

var app = Toa(function () {
  return router.route(this)
})

app.listen(3000, function () {
  console.log('Listened 3000')
})
