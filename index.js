'use strict'
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

var path = require('path')
var methods = require('methods')
var Trie = require('route-trie')

module.exports = Router

function RouterState (root) {
  this.root = typeof root === 'string' ? root.replace(/(\/)+$/, '') : ''
  this.trie = new Trie()
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
  if (typeof handler !== 'function') throw new TypeError('Handler must be a function.')
  this._routerState.otherwise = handler
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

  // back-compat
  if (!context.thunk) context.thunk = arguments[1]

  return context.thunk(function (done) {
    var normalPath = path.normalize(this.path).replace(/\\/g, '/')
    var method = this.method

    if (this.routedPath || (state.root && (normalPath + '/').indexOf(state.root + '/') !== 0)) return done()
    this.routedPath = this.request.routedPath = normalPath
    normalPath = normalPath.replace(state.root, '')

    var matched = state.trie.match(normalPath)
    if (!matched) {
      if (state.otherwise) return this.thunk(state.otherwise.call(this))(done)
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
      this.set('Allow', matched.node.allowMethods)
      this.throw(405, this.method + ' is not allowed in "' + this.path + '".')
    }

    this.params = this.request.params = matched.params
    return this.thunk(handler.call(this))(done)
  })
}

function Route (router, pattern) {
  Object.defineProperty(this, '_routeState', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: {
      router: router,
      pattern: pattern
    }
  })
}

methods.map(function (method) {
  Router.prototype[method] = function (pattern, handler) {
    var state = this._routerState
    var node = state.trie.define(pattern)
    method = method.toUpperCase()
    node.methods = node.methods || Object.create(null)

    if (node.methods[method]) throw new Error('The route in "' + pattern + '" already defined.')
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function.')
    node.methods[method] = handler
    if (!node.allowMethods) node.allowMethods = method
    else node.allowMethods += ', ' + method

    return this
  }
})

methods.map(function (method) {
  Route.prototype[method] = function (handler) {
    var state = this._routeState
    state.router[method](state.pattern, handler)
    return this
  }
})

Router.prototype.del = Router.prototype.delete
Route.prototype.del = Route.prototype.delete
