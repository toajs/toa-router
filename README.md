toa-router
====
A trie router for toa.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

## [toa](https://github.com/toajs/toa)

## Features

- `OPTIONS` support
- `405 Method Not Allowed` support
- `501 Not Implemented` support
- `multi router` support with different url prefix

## Demo
```js
var Toa = require('toa')
var Router = require('toa-router')

var staticRouter = new Router()
var APIRouter = new Router('/api')

staticRouter
  .get('/', function () {
    // ... GET /
  })
  .get('/blog', function () {
    // ... GET /blog
  })
  .get('/about', function () {
    // ... GET /about
  })
  .otherwise(function () {
    // ....
  })

APIRouter
  .get('/posts', function () {
    // ... GET /api/posts
  })
  .get('/tasks', function () {
    // ... GET /api/tasks
  })

APIRouter.define('/posts/:id')
  .get(function () {
    // ... GET /api/post/idxxx
  })
  .put(function () {
    // ... PUT /api/post/idxxx
  })
  .post(function () {
    // ... POST /api/post/idxxx
  })
  .del(function () {
    // ... DELETE /api/post/idxxx
  })

APIRouter.define('/tasks/:id')
  .get(function () {
    // ... GET /api/tasks/idxxx
  })
  .put(function () {
    // ... PUT /api/tasks/idxxx
  })
  .post(function () {
    // ... POST /api/tasks/idxxx
  })
  .del(function () {
    // ... DELETE /api/tasks/idxxx
  })

// use generator
Toa(function *() {
  yield [
    APIRouter.route(this),
    staticRouter.route(this)
  ]
  // do others
}).listen(3000)

// no generator
Toa(function () {
  return this.thunk.all.call(this, APIRouter.route(this), staticRouter.route(this))(function () {
    // do others
  })
}).listen(3000)
```

## Installation

```bash
npm install toa-router
```

## API

```js
var Router = require('toa-router')
```

### new Router([root])

- `root` *Option*, `String`, define the router's scope。

```js
var router = new Router()
var APIRouter = new Router('/api')
```

### Router.prototype.route(context)

Run the router with `context`.

```js
Toa(function () {
  return router.route(this)
}).listen(3000)
```

### Router.prototype.define(pattern)

Define a route with the url pattern.

```js
var route = router.define('/:type/:id')

route.get(function () {})
  .put(function () {})
  .post(function () {})
  .del(function () {})
// support all `http.METHODS`: 'get', 'post', 'put', 'head', 'delete', 'options', 'trace', 'copy', 'lock'...
```

### Router.prototype.get(pattern, handler)
### Router.prototype.put(pattern, handler)
### Router.prototype.post(pattern, handler)
### Router.prototype.del(pattern, handler)
### And more `http.METHODS` ('head', 'delete', 'options', 'trace', 'copy', 'lock'...)

Support generator handler:

```js
router
  .get('/:type/:id', function *() {
    // ...
  })
  .put('/:type/:id', function *() {
    // ...
  })
```

### Router.prototype.otherwise(handler)

Set default route definition that will be used when no other route definition is matched.

### Path Definitions

For pattern definitions, see [route-trie](https://github.com/zensh/route-trie).

Each fragment of the pattern, delimited by a `/`, can have the following signature:

- `string` - ex `/post`
- `string|string` - `|` separated strings, ex `/post|task`
- `:name` - Wildcard route matched to a name, ex `/:type`
- `(regex)` - A regular expression match without saving the parameter (not recommended), ex `/(post|task)`, `/([a-z0-9]{6})`
- `:name(regex)`- Named regular expression match ex `/:type/:id([a-z0-9]{6})`
- `*` - Match remaining path without saving the parameter (not recommended), ex `/*` will match all path.
- `:name(*)`- Named regular expression match, match remaining path, ex `/:type/:other(*)` will match `/post/x` or `/task/x/y` or `/any/x/y/z`...

### this.params, this.request.params

`this.params` will be defined with any matched parameters.

```js
router
  .define('/:type(posts|tasks)')
  .get(function () {
    var data = null
    switch (this.params.type) {
      case 'posts':
        data = mockPosts
        break
      case 'tasks':
        data = mockTasks
        break
    }
    if (data) this.body = resJSON(data)
    else this.throw(404, this.path + ' is not found!')
  })
```

### this.routedPath, this.request.routedPath

`this.routedPath` will be defined with routed path.

## License

The MIT License (MIT)

[npm-url]: https://npmjs.org/package/toa-router
[npm-image]: http://img.shields.io/npm/v/toa-router.svg

[travis-url]: https://travis-ci.org/toajs/toa-router
[travis-image]: http://img.shields.io/travis/toajs/toa-router.svg
