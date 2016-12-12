'use strict'
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

const http = require('http')
const thunks = require('thunks')
const Trie = require('route-trie')

const thunk = thunks.thunk
const slice = Array.prototype.slice
const ROUTED = Symbol('Route')

class Router {
  constructor (root, options) {
    root = typeof root === 'string' ? root : ''
    this.root = root || '/'
    this.trie = new Trie(options)
    this.middleware = []
    this._otherwise = null
  }

  define (pattern) {
    return new Route(this, pattern)
  }

  otherwise () {
    this._otherwise = normalizeHandlers(slice.call(arguments))
    return this
  }

  use (fn) {
    this.middleware.push(toThunkableFn(fn))
    return this
  }

  toThunk () {
    let router = this
    return function (done) {
      router.serve(this)(done)
    }
  }

  serve (context) {
    let router = this
    return thunk.call(context, function * () {
      let path = this.path
      let method = this.method
      let handlers = null

      if (this[ROUTED] || !path.startsWith(router.root)) return
      this[ROUTED] = true

      if (router.root.length > 1) {
        path = path.slice(router.root.length)
        if (!path) path = '/'
      }

      let matched = router.trie.match(path)
      if (!matched.node) {
        if (matched.tsr || matched.fpr) {
          let url = matched.tsr
          if (matched.fpr) url = matched.fpr
          if (router.root.length > 1) {
            url = router.root + url
          }
          this.path = url

          this.status = method === 'GET' ? 301 : 307
          return this.redirect(this.url)
        }

        if (!router._otherwise) {
          this.throw(501, `"${this.path}" not implemented.`)
        }
        handlers = router._otherwise
      } else {
        handlers = matched.node.getHandler(method)
        if (!handlers) {
          // OPTIONS support
          if (method === 'OPTIONS') {
            this.status = 204
            this.set('allow', matched.node.getAllow())
            return this.end()
          }

          handlers = router._otherwise
          if (!handlers) {
            // If no route handler is returned, it's a 405 error
            this.set('allow', matched.node.getAllow())
            this.throw(405, `"${this.method}" is not allowed in "${this.path}".`)
          }
        }
      }

      this.params = this.request.params = matched.params
      for (let fn of router.middleware) yield fn
      for (let fn of handlers) yield fn
    })
  }
}

class Route {
  constructor (router, pattern) {
    this.node = router.trie.define(pattern)
  }
}

for (let method of http.METHODS) {
  let _method = method.toLowerCase()

  Router.prototype[_method] = function (pattern) {
    this.trie.define(pattern).handle(method, normalizeHandlers(slice.call(arguments, 1)))
    return this
  }

  Route.prototype[_method] = function (handler) {
    this.node.handle(method, normalizeHandlers(slice.call(arguments, 0)))
    return this
  }
}

Router.prototype.del = Router.prototype.delete
Route.prototype.del = Route.prototype.delete

function normalizeHandlers (handlers) {
  if (!handlers.length) throw new Error('No router handler')
  return handlers.map(toThunkableFn)
}

function toThunkableFn (fn) {
  if (typeof fn !== 'function') throw new TypeError(`${fn} is not a function!`)
  if (thunks.isThunkableFn(fn)) return fn
  return function (done) { thunk.call(this, fn.call(this))(done) }
}

module.exports = Router
