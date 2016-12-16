'use strict'

const assert = require('assert')
const request = require('supertest')
const thunk = require('thunks')()
const Toa = require('toa')
const tman = require('tman')
const Router = require('..')

tman.suite('toa-router', function () {
  tman.it('GET /', function * () {
    let router = new Router()
    router.get('/', function () {
      this.body = 'OK'
    })

    let app = new Toa()
    app.use(router.toThunk())

    yield request(app.listen())
      .get('/')
      .expect(200)
      .expect('OK')
  })

  tman.it('GET /abc/123', function () {
    let router = new Router()
    router.get('/:type/:id', function () {
      this.body = '/' + this.params.type + '/' + this.params.id
    })

    let app = new Toa()
    app.use(function * () {
      yield router.serve(this)
    })

    return request(app.listen())
      .get('/abc/123')
      .expect(200)
      .expect('/abc/123')
  })

  tman.it('POST /abc/123', function () {
    let router = new Router()
    router
      .get('/:type/:id', function () {
        this.body = '/' + this.params.type + '/' + this.params.id
      })
      .post('/:type/:id', function () {
        this.body = 'POST /' + this.params.type + '/' + this.params.id
      })

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .post('/abc/123')
      .expect(200)
      .expect('POST /abc/123')
  })

  tman.it('HEAD /abc/123', function () {
    let router = new Router()
    router.head('/:type/:id', function () {
      this.status = 200
    })

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .head('/abc/123')
      .expect(200)
  })

  tman.it('OPTIONS /abc/123', function () {
    let router = new Router()
    router
      .get('/:type/:id', function () {})
      .post('/:type/:id', function () {})
      .put('/:type/:id', function () {})
      .del('/:type/:id', function () {})

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE')
      })
  })

  tman.it('501 not implemented', function () {
    let router = new Router()
    router.get('/', function () {})

    let app = new Toa()
    app.onerror = function () {}
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .get('/abc/123')
      .expect(501)
  })

  tman.it('405 not allowed', function () {
    let router = new Router()
    router
      .get('/:type/:id', function () {})
      .post('/:type/:id', function () {})

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .put('/abc/123')
      .expect(405)
  })

  tman.it('otherwise when not match path', function () {
    let router = new Router()
    router
      .get('/test', function () {})
      .otherwise(function () {
        this.body = 'otherwise'
      })

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .get('/some')
      .expect(200)
      .expect('otherwise')
  })

  tman.it('otherwise when not match method', function () {
    let router = new Router()
    router
      .get('/test', function () {})
      .otherwise(function () {
        this.body = 'otherwise'
      })

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .put('/test')
      .expect(200)
      .expect('otherwise')
  })

  tman.it('define /abc/123', function () {
    let router = new Router()
    router.define('/:type/:id')
      .get(function () {})
      .post(function () {})
      .put(function () {})
      .del(function () {})

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE')
      })
  })

  tman.it('define /:filePath*', function () {
    let router = new Router()
    router.define('/:filePath*')
      .get(function () {})
      .post(function () {})
      .put(function () {})
      .del(function () {})

    let app = new Toa()
    app.use(function () {
      return router.serve(this)
    })

    return request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE')
      })
  })

  tman.it('multi router', function () {
    let router1 = new Router()
    let router2 = new Router('/api')

    router1.get('/', function () {
      this.body = 'OK'
    })

    router2.get('/', function () {
      this.body = 'api'
    })

    let app = new Toa()
    app.use(function * () {
      yield [router2.serve(this), router1.serve(this)]
    })

    return request(app.listen())
      .get('/')
      .expect(200)
      .expect('OK')
  })

  tman.it('multi router2', function () {
    let router1 = new Router()
    let router2 = new Router('/api')

    router1.get('/', function () {
      this.body = 'OK'
    })

    router2.get('/', function () {
      return function (callback) {
        this.body = 'api'
        callback()
      }
    })

    let app = new Toa()
    app.use(router2.toThunk())
    app.use(router1.toThunk())

    return request(app.listen())
      .get('/api')
      .expect(200)
      .expect('api')
  })

  tman.suite('middleware', function () {
    tman.it('work with one router', function () {
      let count = 0
      let router = new Router()

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

      let app = new Toa()
      app.use(router.toThunk())

      return request(app.listen())
        .get('/')
        .expect(200)
        .expect('2')
    })

    tman.it('when error', function () {
      let count = 0
      let router = new Router()

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

      let app = new Toa()
      app.use(router.toThunk())

      return request(app.listen())
        .get('/')
        .expect(400)
    })

    tman.it('work with multi router', function () {
      let router1 = new Router('/api')
      let router2 = new Router()

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

      let app = new Toa()
      app.use(router1.toThunk())
      app.use(router2.toThunk())

      let server = app.listen()

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
