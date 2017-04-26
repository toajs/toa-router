'use strict'

const Toa = require('toa')
const Router = require('../')
const app = new Toa()

const router1 = new Router('/abc')
router1.get('/:anything', function () {
  this.body = this.params['anything']
})

const router2 = new Router('/abcd')
router2.get('/:anything', function () {
  this.body = this.params['anything']
})

app.use(router1.toThunk())
app.use(router2.toThunk())

app.listen(3000)
