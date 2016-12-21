'use strict'

const assert = require('assert')
const request = require('supertest')
const Toa = require('toa')
const tman = require('tman')
const Router = require('..')

function newApp (router) {
  let app = new Toa()
  app.use(router.toThunk())
  app.onerror = () => {}
  return app.listen()
}

tman.suite('toa-router', function () {
  tman.it('router.use, router.Handle', function * () {
    let called = 0
    let router = new Router('/api')
    let thunkObj = {
      toThunk: () => {
        return function (done) {
          called++
          done()
        }
      }
    }
    router.use(function () {
      assert.ok(this.path.startsWith('/api'))
      called++
    })
    router.use(thunkObj)
    router.get('/users', function () {
      this.status = 200
      this.body = 'OK'
    })

    let server = newApp(router)
    yield request(server)
      .get('/')
      .expect(404)
    assert.strictEqual(called, 0)

    yield request(server)
      .get('/api')
      .expect(501)
    assert.strictEqual(called, 0)

    yield request(server)
      .get('/api/users')
      .expect(200)
      .expect('OK')
    assert.strictEqual(called, 2)
  })

  tman.it('router with more middlewares', function * () {
    let called = 0
    let router = new Router()

    assert.throws(function () {
      router.get('/')
    })

    assert.throws(function () {
      router.get('/', {})
    })

    router.get('/', function () {
      called++
      assert.strictEqual(called, 1)
    }, function () {
      called++
      assert.strictEqual(called, 2)
    }, function () {
      called++
      assert.strictEqual(called, 3)
      this.body = 'OK'
    })

    let server = newApp(router)
    yield request(server)
      .get('/')
      .expect(200)
      .expect('OK')
    assert.strictEqual(called, 3)
  })

  tman.it('router with a array of middlewares', function * () {
    let called = 0
    let router = new Router()

    router.get('/', [function () {
      called++
      assert.strictEqual(called, 1)
    }, function () {
      called++
      assert.strictEqual(called, 2)
    }, function () {
      called++
      assert.strictEqual(called, 3)
      this.body = 'OK'
    }])

    let server = newApp(router)
    yield request(server)
      .get('/')
      .expect(200)
      .expect('OK')
    assert.strictEqual(called, 3)
  })

  tman.it('with some http.METHODS', function * () {
    let middleware = function () {
      this.body = this.method
    }

    let router = new Router()
    router
      .get('/', middleware)
      .head('/', middleware)
      .post('/', middleware)
      .put('/', middleware)
      .patch('/', middleware)
      .delete('/', middleware)
      .options('/', middleware)

    assert.throws(function () {
      router.get('', middleware)
    })

    let server = newApp(router)
    yield request(server).get('/')
      .expect(200)
      .expect('GET')

    yield request(server).head('/')
      .expect(200)

    yield request(server).post('/')
      .expect(200)
      .expect('POST')

    yield request(server).put('/')
      .expect(200)
      .expect('PUT')

    yield request(server).patch('/')
      .expect(200)
      .expect('PATCH')

    yield request(server).delete('/')
      .expect(200)
      .expect('DELETE')

    yield request(server).options('/')
      .expect(200)
      .expect('OPTIONS')
  })

  tman.it('router.define', function * () {
    let middleware = function () {
      this.body = this.method
    }

    let router = new Router()
    router.define('/api')
      .get(middleware)
      .head(middleware)
      .post(middleware)
      .put(middleware)
      .patch(middleware)
      .delete(middleware)
      .options(middleware)

    assert.throws(function () {
      router.get('/api', middleware)
    })

    let server = newApp(router)
    yield request(server).get('/api')
      .expect(200)
      .expect('GET')

    yield request(server).head('/api')
      .expect(200)

    yield request(server).post('/api')
      .expect(200)
      .expect('POST')

    yield request(server).put('/api')
      .expect(200)
      .expect('PUT')

    yield request(server).patch('/api')
      .expect(200)
      .expect('PATCH')

    yield request(server).delete('/api')
      .expect(200)
      .expect('DELETE')

    yield request(server).options('/api')
      .expect(200)
      .expect('OPTIONS')
  })

  tman.it('automatic handle `OPTIONS` method', function * () {
    let middleware = function () {
      this.body = this.method
    }

    let router = new Router()
    router
      .get('/', middleware)
      .head('/', middleware)
      .post('/', middleware)
      .put('/', middleware)
      .delete('/', middleware)

    let server = newApp(router)
    yield request(server).options('/')
      .expect(204)
      .expect(function (res) {
        assert.strictEqual(res.header.allow, 'GET, HEAD, POST, PUT, DELETE')
      })
  })

  tman.it('automatic handle `501 Not Implemented`', function * () {
    let router = new Router()
    router.get('/abc', function () {
      this.status = 204
    })

    let server = newApp(router)
    yield request(server).get('/')
      .expect(501)
  })

  tman.it('automatic handle `405 Method Not Allowed`', function * () {
    let router = new Router()
    router.get('/abc', function () {
      this.status = 204
    })

    let server = newApp(router)
    yield request(server).put('/abc')
      .expect(405)
      .expect('"PUT" is not allowed in "/abc"')
      .expect(function (res) {
        assert.strictEqual(res.header.allow, 'GET')
      })
  })

  tman.it('router with named pattern', function * () {
    let count = 0
    let router = new Router()

    router.use(function () {
      count++
    })
    router.get('/api/:type/:ID', function () {
      this.body = this.params.type + this.params.ID
    })

    let server = newApp(router)
    yield request(server).get('/api/user/123')
      .expect(200)
      .expect('user123')
    assert.strictEqual(count, 1)
  })

  tman.it('router with double colon pattern', function * () {
    let count = 0
    let router = new Router()

    router.use(function () {
      count++
    })
    router.get('/api/::/:ID', function () {
      this.body = this.params.ID
    })

    let server = newApp(router)
    yield request(server).get('/api/:/123')
      .expect(200)
      .expect('123')
    assert.strictEqual(count, 1)
  })

  tman.it('router with wildcard pattern', function * () {
    let count = 0
    let router = new Router()

    router.use(function () {
      count++
    })
    router.get('/api/:type*', function () {
      this.body = this.params.type
    })

    let server = newApp(router)
    yield request(server).get('/api/user/123')
      .expect(200)
      .expect('user/123')
    assert.strictEqual(count, 1)
  })

  tman.it('router with regexp pattern', function * () {
    let count = 0
    let router = new Router()

    router.use(function () {
      count++
    })
    router.get('/api/:type/:ID(^\\d+$)', function () {
      this.body = this.params.type + this.params.ID
    })

    let server = newApp(router)
    yield request(server).get('/api/user/abc')
      .expect(501)
    assert.strictEqual(count, 0)

    yield request(server).get('/api/user/123')
      .expect(200)
      .expect('user123')
    assert.strictEqual(count, 1)
  })

  tman.it('router with otherwise', function * () {
    let count = 0
    let router = new Router()

    router
      .use(function () {
        count++
      })
      .get('/api', function () {
        this.body = 'OK'
      })
      .otherwise(function () {
        this.status = 404
        this.body = `${this.method} ${this.path}`
      })

    let server = newApp(router)
    yield request(server).get('/api')
      .expect(200)
      .expect('OK')
    assert.strictEqual(count, 1)

    yield request(server).get('/api/user/123')
      .expect(404)
      .expect('GET /api/user/123')
    assert.strictEqual(count, 2)

    yield request(server).put('/api')
      .expect(404)
      .expect('PUT /api')
    assert.strictEqual(count, 3)
  })

  tman.it('router with more otherwise middlewares', function * () {
    let called = 0
    let router = new Router()

    router
      .get('/api', function () {
        this.body = 'OK'
      })
      .otherwise(function () {
        called++
        assert.strictEqual(called, 1)
      }, function () {
        called++
        assert.strictEqual(called, 2)
      }, function () {
        called++
        assert.strictEqual(called, 3)
        this.status = 404
      })

    let server = newApp(router)
    yield request(server)
      .get('/')
      .expect(404)
    assert.strictEqual(called, 3)
  })

  tman.it('router with a array of otherwise middlewares', function * () {
    let called = 0
    let router = new Router()

    router
      .get('/api', function () {
        this.body = 'OK'
      })
      .otherwise([function () {
        called++
        assert.strictEqual(called, 1)
      }, function () {
        called++
        assert.strictEqual(called, 2)
      }, function () {
        called++
        assert.strictEqual(called, 3)
        this.status = 404
      }])

    let server = newApp(router)
    yield request(server)
      .get('/')
      .expect(404)
    assert.strictEqual(called, 3)
  })

  tman.it('router with ignoreCase = true (defalut)', function * () {
    let router = new Router()

    router.get('/Api/:type/:ID', function () {
      this.body = this.params.type + this.params.ID
    })

    let server = newApp(router)
    yield request(server).get('/api/user/123')
      .expect(200)
      .expect('user123')

    yield request(server).get('/API/User/Abc')
      .expect(200)
      .expect('UserAbc')
  })

  tman.it('router with ignoreCase = false', function * () {
    let router = new Router({ignoreCase: false})

    router.get('/Api/:type/:ID', function () {
      this.body = this.params.type + this.params.ID
    })

    let server = newApp(router)
    yield request(server).get('/api/user/123')
      .expect(501)

    yield request(server).get('/Api/User/Abc')
      .expect(200)
      .expect('UserAbc')
  })

  tman.it('router with fixedPathRedirect = true (defalut)', function * () {
    let router = new Router()

    router
      .get('/', function () {
        this.body = '/'
      })
      .get('/abc/efg', function () {
        this.body = '/abc/efg'
      })
      .put('/abc/efg', function () {
        this.body = '/abc/efg'
      })

    let server = newApp(router)
    yield request(server).get('/')
      .expect(200)
      .expect('/')

    yield request(server).get('/abc/efg')
      .expect(200)
      .expect('/abc/efg')

    yield request(server).put('/abc/efg')
      .expect(200)
      .expect('/abc/efg')

    yield request(server).get('/abc//efg')
      .expect(301)
      .expect((res) => {
        assert.strictEqual(res.header.location, '/abc/efg')
      })

    yield request(server).put('/abc//efg')
      .expect(307)
      .expect((res) => {
        assert.strictEqual(res.header.location, '/abc/efg')
      })
  })

  tman.it('router with fixedPathRedirect = false', function * () {
    let router = new Router({fixedPathRedirect: false})

    router
      .get('/', function () {
        this.body = '/'
      })
      .get('/abc/efg', function () {
        this.body = '/abc/efg'
      })
      .put('/abc/efg', function () {
        this.body = '/abc/efg'
      })

    let server = newApp(router)
    yield request(server).get('/')
      .expect(200)
      .expect('/')

    yield request(server).get('/abc/efg')
      .expect(200)
      .expect('/abc/efg')

    yield request(server).put('/abc/efg')
      .expect(200)
      .expect('/abc/efg')

    yield request(server).get('/abc//efg')
      .expect(501)

    yield request(server).put('/abc//efg')
      .expect(501)
  })

  tman.it('router with trailingSlashRedirect = true (defalut)', function * () {
    let router = new Router()

    router
      .get('/', function () {
        this.body = '/'
      })
      .get('/abc/efg', function () {
        this.body = '/abc/efg'
      })
      .put('/abc/xyz/', function () {
        this.body = '/abc/xyz/'
      })

    let server = newApp(router)
    yield request(server).get('/')
      .expect(200)
      .expect('/')

    yield request(server).get('/abc/efg')
      .expect(200)
      .expect('/abc/efg')

    yield request(server).get('/abc/efg/')
      .expect(301)
      .expect((res) => {
        assert.strictEqual(res.header.location, '/abc/efg')
      })

    yield request(server).put('/abc/xyz/')
      .expect(200)
      .expect('/abc/xyz/')

    yield request(server).put('/abc/xyz')
      .expect(307)
      .expect((res) => {
        assert.strictEqual(res.header.location, '/abc/xyz/')
      })
  })

  tman.it('router with trailingSlashRedirect = false', function * () {
    let router = new Router({trailingSlashRedirect: false})

    router
      .get('/', function () {
        this.body = '/'
      })
      .get('/abc/efg', function () {
        this.body = '/abc/efg'
      })
      .put('/abc/xyz/', function () {
        this.body = '/abc/xyz/'
      })

    let server = newApp(router)
    yield request(server).get('/')
      .expect(200)
      .expect('/')

    yield request(server).get('/abc/efg')
      .expect(200)
      .expect('/abc/efg')

    yield request(server).get('/abc/efg/')
      .expect(501)

    yield request(server).put('/abc/xyz/')
      .expect(200)
      .expect('/abc/xyz/')

    yield request(server).put('/abc/xyz')
      .expect(501)
  })

  tman.it('router with root and fixedPathRedirect', function * () {
    let router = new Router({root: '/api'})

    router
      .get('/abc/efg', function () {
        this.body = '/api/abc/efg'
      })

    let server = newApp(router)
    yield request(server).get('/api//abc///efg//')
      .expect(301)
      .expect((res) => {
        assert.strictEqual(res.header.location, '/api/abc/efg')
      })
  })

  tman.it('when router middleware error', function * () {
    let count = 0
    let router = new Router()

    router
      .use(function () {
        this.throw(404, 'some error')
      })
      .get('/abc/efg', function () {
        count++
        this.body = '/abc/efg'
      })

    let server = newApp(router)
    yield request(server).get('/abc/efg')
      .expect(404)
      .expect('some error')
    assert.strictEqual(count, 0)
  })
})
