'use strict';
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

var path = require('path');
var assert = require('assert');
var methods = require('methods');
var Trie = require('route-trie');

module.exports = Router;

function RouterState(root) {
  this.root = root;
  this.trie = new Trie();
}

function Router(root) {
  if (!(this instanceof Router)) return new Router(root);

  Object.defineProperty(this, '_routerState', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: new RouterState(root)
  });
}

Router.prototype.define = function (pattern) {
  return new Route(this, pattern);
};

Router.prototype.route = function (context, Thunk) {
  var state = this._routerState;

  return Thunk.call(context)(function () {
    var normalPath = path.normalize(this.path);
    var method = this.method;

    if (state.root && normalPath.indexOf(state.root) !== 0) return;
    normalPath = normalPath.replace(state.root, '');

    var match = state.trie.match(normalPath);
    if (!match) this.throw(501, '"' + this.path + '" is not implemented.');

    // If no HEAD route, default to GET.
    if (method === 'HEAD' && !match.node.methods.HEAD) method = 'GET';

    // OPTIONS support
    if (method === 'OPTIONS') {
      this.status = 204;
      this.set('Allow', match.node.allowMethods);
      return;
    }

    var handler = match.node.methods[method];

    // If no route handler is returned
    // it's a 405 error
    if (!handler) {
      this.set('Allow', match.node.allowMethods);
      this.throw(405, this.method + ' is not implemented in "' + this.path + '".');
    }

    this.params = this.request.params = match.params;
    return handler.call(this, Thunk);
  });
};

function Route(router, pattern) {
  Object.defineProperty(this, '_routeState', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: {
      router: router,
      pattern: pattern,
    }
  });
}

methods.map(function (method) {
  Router.prototype[method] = function (pattern, handler) {
    var state = this._routerState;
    var route = state.trie.define(pattern);
    method = method.toUpperCase();
    route.methods = route.methods || {};

    assert(!route.methods[method], 'The route in "' + pattern + '" already defined.');
    assert(typeof handler === 'function', 'Handler must be a function.');
    route.methods[method] = handler;
    if (!route.allowMethods) route.allowMethods = method;
    else route.allowMethods += ', ' + method;

    return this;
  };
});

methods.map(function (method) {
  Route.prototype[method] = function (handler) {
    var state = this._routeState;
    state.router[method](state.pattern, handler);
    return this;
  };
});

Router.prototype.del = Router.prototype.delete;
Route.prototype.del = Route.prototype.delete;
