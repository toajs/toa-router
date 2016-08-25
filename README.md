toa-router
====
A trie router for toa.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads][downloads-image]][downloads-url]

## [Toa](https://github.com/toajs/toa)

## Features

- `OPTIONS` support
- `405 Method Not Allowed` support
- `501 Not Implemented` support
- `multi router` support with different url prefix
- `middleware` support middleware with different url prefix

## Demo
```js
const Toa = require('toa')
const Router = require('toa-router')

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
```

## Installation

```bash
npm install toa-router
```

## API

```js
var Router = require('toa-router')
```

### Five usage in Toa:

There five usages for toa-router, but only **One think**: thunk

**Usage 1:**
```js
var app = Toa(function () {
  return router.route(this)
})
```

**Usage 2:**
```js
var app = Toa(function () {
  return router
})
```

**Usage 3:**
```js
var app = Toa(function *() {
  yield router.route(this)
})
```

**Usage 4:**
```js
var app = Toa(function *() {
  yield router
})
```

**Usage 5:**
```js
var app = Toa()
app.use(router.toThunk())
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

### Router.prototype.use(middleware)

Add middlewares to this router. They will run before router handle.

```js
router.use(function () {
  console.log('sync middleware')
})

router.use(function () {
  console.log('promise middleware')
  return Promise.resolve('something')
})

router.use(function (done) {
  console.log('sync middleware')
  done()
})

router.use(function * () {
  console.log('generator middleware')
  yield 'something'
})

router.use(async function () {
  console.log('async/await middleware')
  await Promise.resolve('something')
})
```

### Pattern Definitions

For pattern definitions, see [route-trie](https://github.com/zensh/route-trie).

Each fragment of the pattern, delimited by a `/`, can have the following signature:

- `string` - simple string.

  Define `/post` will matched:
  ```
  '/post'
  ```

- `string|string` - `|` separated strings.

  Define `/post|task` will matched:
  ```
  '/post'
  '/task'
  ```

- `:name` - Wildcard route matched to a name.

  Define `/:type` will matched:
  ```
  '/post', with params `{type: 'post'}`
  '/task', with params `{type: 'task'}`
  ```

- `prefix:name` - Wildcard route matched to a name.

  Define `/api:type` will matched:
  ```
  '/apipost', with params `{type: 'post'}`
  '/apitask', with params `{type: 'task'}`
  ```

- `(regex)` - A regular expression match without saving the parameter (not recommended).

  Define `/(post|task)`  will matched:
  ```
  '/post'
  '/task'
  ```

  Define `/([a-z0-9]{6})` will matched:
  ```
  '/abcdef'
  '/123456'
  ```

- `:name(regex)`- Named regular expression match.

  Define `/:type/:id([a-z0-9]{6})` will matched:
  ```
  '/post/abcdef', with params `{type: 'post', id: 'abcdef'}`
  '/task/123456', with params `{type: 'task', id: '123456'}`
  ```

- `prefix:name(regex)`- Named regular expression match.

  Define `/api:type/id:id([a-z0-9]{6})` will matched:
  ```
  '/apipost/idabcdef', with params `{type: 'post', id: 'abcdef'}`
  '/apitask/id123456', with params `{type: 'task', id: '123456'}`
  ```

- `(*)` - Match remaining path without saving the parameter (not recommended).

  Define `/(*)` will match all path.

- `:name(*)`- Named regular expression match, match remaining path.

  Define `/:type/:other(*)` will matched:
  ```
  '/post/abcdef', with params `{type: 'post', other: 'abcdef'}`
  '/post/abcdef/ghi', with params `{type: 'post', other: 'abcdef/ghi'}`
  '/a/b/c/d/e', with params `{type: 'a', other: 'b/c/d/e'}`
  ```

**Notice from route-trie for regex pattern:**

```js
var trie = new Trie()
var node = trie.define('/abc/([0-9]{2})')
assert(trie.match('/abc/47').node === node)

var trie = new Trie()
var node = trie.define('/abc/(\d{2})')
trie.match('/abc/47')  // null
assert(trie.match('/abc/dd').node === node)

var trie = new Trie();
var node = trie.define('/abc/([a-z]{2})')
assert(trie.match('/abc/ab').node === node)

var trie = new Trie();
var node = trie.define('/abc/(\w{2})')
trie.match('/abc/ab')  // null
assert(trie.match('/abc/ww').node === node)

var trie = new Trie();
var node = trie.define('/abc/(\\w{2})')
assert(trie.match('/abc/ab').node === node)
```

Due to JS [String Escape Notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String): `'\d' === 'd'`, `trie.define('/abc/(\d{2})') === trie.define('/abc/(d{2})')`.
`trie.define` accept a string literal, not a regex literal, the `\` maybe be escaped!

### Router.prototype.toThunk()

Return a thunk function that wrap the router.

```js
var app = Toa()
app.use(router.toThunk())
```

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

[downloads-url]: https://npmjs.org/package/toa-router
[downloads-image]: http://img.shields.io/npm/dm/toa-router.svg?style=flat-square
