'use strict';
/*global describe, it, before, after, beforeEach, afterEach, Promise, noneFn*/

var assert = require('assert');
var request = require('supertest');
var Toa = require('toa');
var Router = require('../');

describe('toa-router', function() {

  it('GET /', function(done) {
    var router = new Router();
    router.get('/', function() {
      this.body = 'OK';
    });

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .get('/')
      .expect(200)
      .expect('OK')
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('GET /abc/123', function(done) {
    var router = new Router();
    router.get('/:type/:id', function() {
      this.body = '/' + this.params.type + '/' + this.params.id;
    });

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .get('/abc/123')
      .expect(200)
      .expect('/abc/123')
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('POST /abc/123', function(done) {
    var router = new Router();
    router
      .get('/:type/:id', function() {
        this.body = '/' + this.params.type + '/' + this.params.id;
      })
      .post('/:type/:id', function() {
        this.body = 'POST /' + this.params.type + '/' + this.params.id;
      });

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .post('/abc/123')
      .expect(200)
      .expect('POST /abc/123')
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('HEAD /abc/123', function(done) {
    var router = new Router();
    router.head('/:type/:id', function() {
      this.status = 200;
    });

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .head('/abc/123')
      .expect(200)
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('HEAD -> GET /abc/123', function(done) {
    var router = new Router();
    router.get('/:type/:id', function() {
      this.status = 200;
    });

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .head('/abc/123')
      .expect(200)
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('OPTIONS /abc/123', function(done) {
    var router = new Router();
    router
      .get('/:type/:id', function() {})
      .post('/:type/:id', function() {})
      .put('/:type/:id', function() {})
      .del('/:type/:id', function() {});

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function(res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE');
      })
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('501 not implemented', function(done) {
    var router = new Router();
    router.get('/', function() {});

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .get('/abc/123')
      .expect(501)
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('405 not allowed', function(done) {
    var router = new Router();
    router
      .get('/:type/:id', function() {})
      .post('/:type/:id', function() {});

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .put('/abc/123')
      .expect(405)
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('define /abc/123', function(done) {
    var router = new Router();
    router.define('/:type/:id')
      .get(function() {})
      .post(function() {})
      .put(function() {})
      .del(function() {});

    var app = Toa(function() {
      return router.route(this);
    });

    request(app.listen())
      .options('/abc/123')
      .expect(204)
      .expect(function(res) {
        assert.strictEqual(res.headers.allow, 'GET, POST, PUT, DELETE');
      })
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('multi router', function(done) {
    var router1 = new Router();
    var router2 = new Router('/api');

    router1.get('/', function() {
      this.body = 'OK';
    });

    router2.get('/', function() {
      this.body = 'api';
    });

    var app = Toa(function() {
      return this.thunk.all(router2.route(this), router1.route(this));
    });

    request(app.listen())
      .get('/')
      .expect(200)
      .expect('OK')
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });

  it('multi router2', function(done) {
    var router1 = new Router();
    var router2 = new Router('/api');

    router1.get('/', function() {
      this.body = 'OK';
    });

    router2.get('/', function() {
      this.body = 'api';
    });

    var app = Toa(function() {
      return this.thunk.all(router2.route(this), router1.route(this));
    });

    request(app.listen())
      .get('/api')
      .expect(200)
      .expect('api')
      .end(function(err) {
        app.server.close();
        done(err);
      });
  });
});
