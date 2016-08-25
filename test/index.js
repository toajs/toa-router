'use strict'
/* global Promise */

var assert = require('assert')
var request = require('supertest')
var toa = require('toa')
var tman = require('tman')
var Router = require('..')

tman.suite('toa-router', function () {
  tman.it('GET /', function () {
    var router = new Router()
    router.get('/', function () {
      this.body = 'OK'
    })

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa()
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
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

    var app = toa(function () {
      return this.thunk.all(router2.route(this), router1.route(this))
    })

    return request(app.listen())
      .get('/api')
      .expect(200)
      .expect('api')
  })

  tman.it('middleware', function () {
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

    var app = toa()
    app.use(router.toThunk())

    return request(app.listen())
      .get('/')
      .expect(200)
      .expect('2')
  })
})
