'use strict'
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

var path = require('path')
var thunks = require('thunks')
var methods = require('methods')
var Trie = require('route-trie')
var thunk = thunks()

module.exports = Router

function RouterState (root) {
  this.root = typeof root === 'string' ? root.replace(/(\/)+$/, '') : ''
  this.trie = new Trie()
  this.preHooks = []
  this.otherwise = null
}

function Router (root) {
  if (!(this instanceof Router)) return new Router(root)

  Object.defineProperty(this, '_routerState', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: new RouterState(root)
  })
}

Router.prototype.define = function (pattern) {
  return new Route(this, pattern)
}

Router.prototype.otherwise = function (handler) {
  this._routerState.otherwise = toThunkableFn(handler)
  return this
}

Router.prototype.use = function (fn) {
  this._routerState.preHooks.push(toThunkableFn(fn))
  return this
}

Router.prototype.toThunk = function () {
  var ctx = this
  return function (done) {
    ctx.route(this)(done)
  }
}

Router.prototype.route = function (context) {
  var state = this._routerState
  var otherwise = state.otherwise
  var preHooks = this._routerState.preHooks.slice()

  function worker (ctx, handler) {
    return thunk.seq.call(ctx, preHooks)(function (err) {
      if (err != null) throw err
      return handler
    })
  }

  return thunk.call(context, function (done) {
    var normalPath = path.normalize(this.path).replace(/\\/g, '/')
    var method = this.method

    if (this.routedPath || (state.root && (normalPath + '/').indexOf(state.root + '/') !== 0)) {
      return done()
    }
    this.routedPath = this.request.routedPath = normalPath
    normalPath = normalPath.replace(state.root, '')

    var matched = state.trie.match(normalPath)
    if (!matched) {
      if (otherwise) return worker(this, otherwise)(done)
      this.throw(501, '"' + this.path + '" is not implemented.')
    }

    // If no HEAD route, default to GET.
    if (method === 'HEAD' && !matched.node.methods.HEAD) method = 'GET'

    // OPTIONS support
    if (method === 'OPTIONS') {
      this.status = 204
      this.set('Allow', matched.node.allowMethods)
      return done()
    }

    var handler = matched.node.methods[method]

    // If no route handler is returned
    // it's a 405 error
    if (!handler) {
      if (otherwise) return worker(this, otherwise)(done)
      this.set('Allow', matched.node.allowMethods)
      this.throw(405, this.method + ' is not allowed in "' + this.path + '".')
    }

    this.params = this.request.params = matched.params
    worker(this, handler)(done)
  })
}

function Route (router, pattern) {
  Object.defineProperty(this, '_node', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: router._routerState.trie.define(pattern)
  })
}

methods.forEach(function (method) {
  Router.prototype[method] = function (pattern, handler) {
    defineHandler(this._routerState.trie.define(pattern), method, toThunkableFn(handler))
    return this
  }

  Route.prototype[method] = function (handler) {
    defineHandler(this._node, method, toThunkableFn(handler))
    return this
  }
})

Router.prototype.del = Router.prototype.delete
Route.prototype.del = Route.prototype.delete

function defineHandler (node, method, handler) {
  method = method.toUpperCase()
  node.methods = node.methods || Object.create(null)

  if (node.methods[method]) {
    throw new Error('The route in "' + node._nodeState.pattern + '" already defined.')
  }
  node.methods[method] = handler
  if (!node.allowMethods) node.allowMethods = method
  else node.allowMethods += ', ' + method
}

function toThunkableFn (fn) {
  if (typeof fn !== 'function') throw new TypeError('must be a function!')
  if (thunks.isThunkableFn(fn)) return fn
  return function (done) { thunk.call(this, fn.call(this))(done) }
}
