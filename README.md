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
var Toa = require('toa');
var Router = require('toa-router');

var staticRouter = new Router();
var APIRouter = new Router('/api');

staticRouter
  .get('/', function (Thunk) {
    // ... GET /
  })
  .get('/blog', function (Thunk) {
    // ... GET /blog
  })
  .get('/about', function (Thunk) {
    // ... GET /about
  });

APIRouter
  .get('/posts', function (Thunk) {
    // ... GET /api/posts
  })
  .get('/tasks', function (Thunk) {
    // ... GET /api/tasks
  });

APIRouter.define('/posts/:id')
  .get(function (Thunk) {
    // ... GET /api/post/idxxx
  })
  .put(function (Thunk) {
    // ... PUT /api/post/idxxx
  })
  .post(function (Thunk) {
    // ... POST /api/post/idxxx
  })
  .del(function (Thunk) {
    // ... DELETE /api/post/idxxx
  });

APIRouter.define('/tasks/:id')
  .get(function (Thunk) {
    // ... GET /api/tasks/idxxx
  })
  .put(function (Thunk) {
    // ... PUT /api/tasks/idxxx
  })
  .post(function (Thunk) {
    // ... POST /api/tasks/idxxx
  })
  .del(function (Thunk) {
    // ... DELETE /api/tasks/idxxx
  });

Toa(function (Thunk) {
  return Thunk.call(this)(function () {
    return APIRouter.route(this, Thunk);
  })(function () {
    return staticRouter.route(this, Thunk);
  })(function () {
    // do others
  });
}).listen(3000);

// use generator

// Toa(function* (Thunk) {
//   yield APIRouter.route(this, Thunk);
//   yield staticRouter.route(this, Thunk);
//   // do others
// }).listen(3000);
```

## Installation

```bash
npm install toa-router
```

## API

```js
var Router = require('toa-router');
```

### new Router([root])

- `root` *Option*, `String`, define the router's scope。

```js
var router = new Router();
var APIRouter = new Router('/api');
```

### Router.prototype.route(context, Thunk)

Run the router with `context` and `Thunk`.

```js
Toa(function (Thunk) {
  return router.route(this, Thunk);
}).listen(3000);
```

### Router.prototype.define(pattern)

Define a route with the url pattern.

```js
var route = router.define('/:type/:id');

route.get(function (Thunk) {})
  .put(function (Thunk) {})
  .post(function (Thunk) {})
  .del(function (Thunk) {});
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
  .get('/:type/:id', function* (Thunk) {
    // ...
  })
  .put('/:type/:id', function* (Thunk) {
    // ...
  });
```

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
  .get(function (Thunk) {
    var data = null;
    switch (this.params.type) {
      case 'posts':
        data = mockPosts;
        break;
      case 'tasks':
        data = mockTasks;
        break;
    }
    if (data) this.body = resJSON(data);
    else this.throw(404, this.path + ' is not found!');
  });
```

### this.routedPath, this.request.routedPath

`this.routedPath` will be defined with routed path.

## License

The MIT License (MIT)

[npm-url]: https://npmjs.org/package/toa-router
[npm-image]: http://img.shields.io/npm/v/toa-router.svg

[travis-url]: https://travis-ci.org/toajs/toa-router
[travis-image]: http://img.shields.io/travis/toajs/toa-router.svg