'use strict'
/* global Promise */

var assert = require('assert')
var request = require('supertest')
var thunk = require('thunks')()
var Toa = require('toa')
var tman = require('tman')
var Router = require('..')

tman.suite('toa-router', function () {
  tman.it('GET /', function () {
    var router = new Router()
    router.get('/', function () {
      this.body = 'OK'
    })

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .get('/')
      .expect(200)
      .expect('OK')
  })

  tman.it('GET /abc/123', function () {
    var router = new Router()
    router.get('/:type/:id', function () {
      this.body = '/' + this.params.type + '/' + this.params.id
    })

    var app = new Toa()
    app.use(function () {
      return router
    })

    return request(app.listen())
      .get('/abc/123')
      .expect(200)
      .expect('/abc/123')
  })

  tman.it('POST /abc/123', function () {
    var router = new Router()
    router
      .get('/:type/:id', function () {
        this.body = '/' + this.params.type + '/' + this.params.id
      })
      .post('/:type/:id', function () {
        this.body = 'POST /' + this.params.type + '/' + this.params.id
      })

    var app = new Toa()
    app.use(router.toThunk())

    return request(app.listen())
      .post('/abc/123')
      .expect(200)
      .expect('POST /abc/123')
  })

  tman.it('HEAD /abc/123', function () {
    var router = new Router()
    router.head('/:type/:id', function () {
      this.status = 200
    })

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .head('/abc/123')
      .expect(200)
  })

  tman.it('HEAD -> GET /abc/123', function () {
    var router = new Router()
    router.get('/:type/:id', function () {
      this.status = 200
    })

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .head('/abc/123')
      .expect(200)
  })

  tman.it('OPTIONS /abc/123', function () {
    var router = new Router()
    router
      .get('/:type/:id', function () {})
      .post('/:type/:id', function () {})
      .put('/:type/:id', function () {})
      .del('/:type/:id', function () {})

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE')
      })
  })

  tman.it('501 not implemented', function () {
    var router = new Router()
    router.get('/', function () {})

    var app = new Toa()
    app.onerror = function () {}
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .get('/abc/123')
      .expect(501)
  })

  tman.it('405 not allowed', function () {
    var router = new Router()
    router
      .get('/:type/:id', function () {})
      .post('/:type/:id', function () {})

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .put('/abc/123')
      .expect(405)
  })

  tman.it('otherwise when not match path', function () {
    var router = new Router()
    router
      .get('/test', function () {})
      .otherwise(function () {
        this.body = 'otherwise'
      })

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .get('/some')
      .expect(200)
      .expect('otherwise')
  })

  tman.it('otherwise when not match method', function () {
    var router = new Router()
    router
      .get('/test', function () {})
      .otherwise(function () {
        this.body = 'otherwise'
      })

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .put('/test')
      .expect(200)
      .expect('otherwise')
  })

  tman.it('define /abc/123', function () {
    var router = new Router()
    router.define('/:type/:id')
      .get(function () {})
      .post(function () {})
      .put(function () {})
      .del(function () {})

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE')
      })
  })

  tman.it('define /:filePath(*)', function () {
    var router = new Router()
    router.define('/:filePath(*)')
      .get(function () {})
      .post(function () {})
      .put(function () {})
      .del(function () {})

    var app = new Toa()
    app.use(function () {
      return router.route(this)
    })

    return request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE')
      })
  })

  tman.it('multi router', function () {
    var router1 = new Router()
    var router2 = new Router('/api')

    router1.get('/', function () {
      this.body = 'OK'
    })

    router2.get('/', function () {
      this.body = 'api'
    })

    var app = new Toa()
    app.use(function () {
      return this.thunk.all(router2.route(this), router1.route(this))
    })

    return request(app.listen())
      .get('/')
      .expect(200)
      .expect('OK')
  })

  tman.it('multi router2', function () {
    var router1 = new Router()
    var router2 = new Router('/api')

    router1.get('/', function () {
      this.body = 'OK'
    })

    router2.get('/', function () {
      return function (callback) {
        this.body = 'api'
        callback()
      }
    })

    var app = new Toa()
    app.use(function () {
      return this.thunk.all(router2.route(this), router1.route(this))
    })

    return request(app.listen())
      .get('/api')
      .expect(200)
      .expect('api')
  })

  tman.suite('middleware', function () {
    tman.it('work with one router', function () {
      var count = 0
      var router = new Router()

      router.use(function () {
        count++
      })

      router.use(function (done) {
        setTimeout(function () {
          count++
          done()
        }, 100)
      })

      router.get('', function () {
        this.body = String(count)
      })

      var app = new Toa()
      app.use(router.toThunk())

      return request(app.listen())
        .get('/')
        .expect(200)
        .expect('2')
    })

    tman.it('when error', function () {
      var count = 0
      var router = new Router()

      router.use(function (done) {
        setTimeout(function () {
          count++
          done()
        }, 100)
      })

      router.use(function () {
        count++
        this.throw(400)
      })

      router.get('', function () {
        this.body = String(count)
      })

      var app = new Toa()
      app.use(router.toThunk())

      return request(app.listen())
        .get('/')
        .expect(400)
    })

    tman.it('work with multi router', function () {
      var router1 = new Router('/api')
      var router2 = new Router()

      router1.use(function () {
        this.state.name = 'router1'
      })

      router2.use(function (done) {
        this.state.name = 'router2'
        done()
      })

      router1.get('/', function () {
        this.body = 'Hello ' + this.state.name
      })

      router1.get('/user', function () {
        this.body = 'User ' + this.state.name
      })

      router2.get('/', function () {
        this.body = 'Hello ' + this.state.name
      })

      var app = new Toa()
      app.use(router1.toThunk())
      app.use(router2.toThunk())

      var server = app.listen()

      return thunk.all([
        request(server)
          .get('/api')
          .expect(200)
          .expect('Hello router1'),
        request(server)
          .get('/')
          .expect(200)
          .expect('Hello router2'),
        request(server)
          .get('/api/user')
          .expect(200)
          .expect('User router1')
      ])
    })
  })
})
