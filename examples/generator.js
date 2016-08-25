'use strict'
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT
const Toa = require('toa')
const Router = require('..')

const app = Toa()
const APIrouter = new Router('/api')
const otherRouter = new Router()

app.use(function () {
  this.state.ip = this.ip
})

APIrouter.use(function * () {
  this.state.path = this.path
  this.state.token = yield Promise.resolve({uid: 'uidxxx'})
  this.state.router = yield Promise.resolve('APIrouter') // some async task
})

otherRouter.use(function * () {
  this.state.path = this.path
  this.state.router = yield Promise.resolve('otherRouter') // some async task
})

APIrouter.get('/user', function () {
  this.state.user = 'user'
  this.body = this.state
})

APIrouter.get('(*)', function () {
  this.body = this.state
})

otherRouter.get('(*)', function () {
  this.body = this.state
})

app.use(APIrouter.toThunk()) // we should use APIrouter firstly
app.use(otherRouter.toThunk())

app.listen(3000)

// Please try GET:
// http://localhost:3000
// http://localhost:3000/abc
// http://localhost:3000/abc/efg
// http://localhost:3000/api
// http://localhost:3000/api/abc
// http://localhost:3000/api/abc/efg
