toa-router
====
A trie router for toa.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][downloads-url]

## v2 has a breaking change from v1.x https://github.com/toajs/toa-router/tree/v1.5.2

## [Toa](https://github.com/toajs/toa)

## Features

1. Support regexp
2. Support multi-router
3. Support router layer middlewares
4. Support fixed path automatic redirection
5. Support trailing slash automatic redirection
6. Automatic handle `405 Method Not Allowed`
7. Automatic handle `501 Not Implemented`
8. Automatic handle `OPTIONS` method
9. Best Performance

## Demo
```js
const Toa = require('toa')
const Router = require('toa-router')

const router = new Router()
router
  .get('/:name', function () { // sync handler
    this.body = `${this.method} /${this.params.name}`
  })
  .get('/thunk', function (done) { // thunk handler
    this.body = 'thunk handler'
    done()
  })
  .get('/generator', function * () { // generator handler
    this.body = yield Promise.resolve('generator handler')
  })
  .get('/async', async function () { // async/await handler in Node.js v7
    this.body = await Promise.resolve('async/await handler')
  })
  .otherwise(function () {
    this.throw(404)
  })

router.define('/user/:id([0-9]+)')
  .get(function () {
    this.body = 'Read from:' + this.method + ' ' + this.path
  })
  .post(function () {
    this.body = 'Add to:' + this.method + ' ' + this.path
  })

const app = new Toa()
app.use(router.toThunk())
app.listen(3000, () => console.log('Listened 3000'))
```

## Installation

```bash
npm install toa-router
```

## Router Pattern Definitions

For pattern definitions, see [route-trie](https://github.com/zensh/route-trie).

The defined pattern can contain three types of parameters:

| Syntax | Description |
|--------|------|
| `:name` | named parameter |
| `:name*` | named with catch-all parameter |
| `:name(regexp)` | named with regexp parameter |
| `::name` | not named parameter, it is literal `:name` |

Named parameters are dynamic path segments. They match anything until the next '/' or the path end:

Defined: `/api/:type/:ID`
```
/api/user/123             matched: type="user", ID="123"
/api/user                 no match
/api/user/123/comments    no match
```

Named with catch-all parameters match anything until the path end, including the directory index (the '/' before the catch-all). Since they match anything until the end, catch-all parameters must always be the final path element.

Defined: `/files/:filepath*`
```
/files                           no match
/files/LICENSE                   matched: filepath="LICENSE"
/files/templates/article.html    matched: filepath="templates/article.html"
```

Named with regexp parameters match anything using regexp until the next '/' or the path end:

Defined: `/api/:type/:ID(^\\d+$)`
```
/api/user/123             matched: type="user", ID="123"
/api/user                 no match
/api/user/abc             no match
/api/user/123/comments    no match
```

The value of parameters is saved on the `context.params`. Retrieve the value of a parameter by name:
```
let type = this.params.type
let id   = this.params.ID
```

**Notice for regex pattern** from [route-trie](https://github.com/zensh/route-trie):

As mentioned above, you may use regular expressions defining node:

```js
var node = trie.define('/abc/:name([0-9]{2})')
assert(trie.match('/abc/47').node === node)
```

But due to [JavaScript String Escape Notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String): `'\d' === 'd'`, `trie.define('/abc/:name(\d{2})') === trie.define('/abc/:name(d{2})')`.
`trie.define` accept a string literal, not a regex literal, the `\` maybe be escaped!

```js
var node = trie.define('/abc/:name(\d{2})')
trie.match('/abc/47')  // null
assert(trie.match('/abc/dd').node === node)
```

The same for `\w`, `\S`, etc.

To use backslash (`\`) in regular expression you have to escape it manually:

```js
var node = trie.define('/abc/:name(\\w{2})')
assert(trie.match('/abc/ab').node === node)
```

## API

```js
const Router = require('toa-router')
```

### new Router(options)

- `options.root` {String}, optional, default to `/`, define the router's scope.
- `options.ignoreCase` {Boolean}, optional, default to `true`, ignore case.
- `options.fixedPathRedirect`: {Boolean}, default to `true`. If enabled, the trie will detect if the current path can't be matched but a handler for the fixed path exists. matched.fpr will returns either a fixed redirect path or an empty string. For example when "/api/foo" defined and matching "/api//foo", The result matched.fpr is "/api/foo".
- `options.trailingSlashRedirect`: {Boolean}, default to `true`. If enabled, the trie will detect if the current path can't be matched but a handler for the path with (without) the trailing slash exists. matched.tsr will returns either a redirect path or an empty string. For example if /foo/ is requested but a route only exists for /foo, the client is redirected to /foo. For example when "/api/foo" defined and matching "/api/foo/", The result matched.tsr is "/api/foo".

```js
const router = new Router()
const APIRouter = new Router({root: '/api'})
```

### Router.prototype.serve(context)

Returns thunk function.

### Router.prototype.define(pattern)

Define a route with the url pattern.

```js
router.define('/:type/:id')
  .get(someHandler)
  .put(someHandler)
  .post(someHandler)
  .del(someHandler)
// support all `http.METHODS`: 'get', 'post', 'put', 'head', 'delete', 'options', 'trace', 'copy', 'lock'...
```

### Router.prototype.get(pattern, handler...)
### Router.prototype.put(pattern, handler...)
### Router.prototype.post(pattern, handler...)
### Router.prototype.del(pattern, handler...)
### And all `http.METHODS`

Support generator handler and async/await handler:
```js
router
  .get('/:type/:id', function * () {
    // ...
  })
  .put('/:type/:id', async function () {
    // ...
  })
```

Support one more handlers:
```js
router
  .get('/:type/:id', handler1, handler2, handler3)
  .put('/:type/:id', [handler4, handler5, handler6])
```

### Router.prototype.otherwise(handler...)

Set default route definition that will be used when no other route definition is matched.

### Router.prototype.use(handler)

Add handler as middleware to this router. They will run before router handler.

```js
router
  .use(function () {
    console.log('sync middleware')
  })
  .use(function (done) {
    console.log('sync middleware')
    done()
  })
  .use(function * () {
    console.log('generator middleware')
    yield 'something'
  })
  .use(async function () {
    console.log('async/await middleware')
    await Promise.resolve('something')
  })
  .get('/abc', function () {
    this.body = 'hello!'
  })
```


### Router.prototype.toThunk()

Return a thunk function that wrap the router. We can use this thunk function as middleware.
```js
const app = Toa()
app.use(router.toThunk())
```

### context.params, context.request.params

`this.params` will be defined with any matched parameters.

## License

The MIT License (MIT)

[npm-url]: https://npmjs.org/package/toa-router
[npm-image]: http://img.shields.io/npm/v/toa-router.svg

[travis-url]: https://travis-ci.org/toajs/toa-router
[travis-image]: http://img.shields.io/travis/toajs/toa-router.svg

[coveralls-url]: https://coveralls.io/r/toajs/toa-router
[coveralls-image]: https://coveralls.io/repos/toajs/toa-router/badge.svg

[downloads-url]: https://npmjs.org/package/toa-router
[downloads-image]: http://img.shields.io/npm/dm/toa-router.svg?style=flat-square
