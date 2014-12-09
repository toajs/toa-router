'use strict';
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

var assert = require('assert');
var slugReg = /^[\w\.-]+$/;
var parameterReg = /^\:\w+\b/;

module.exports = Trie;

function Trie(flags) {
  this.flags = flags ? 'i' : '';
  this.root = new Node('root');
}

Trie.prototype.define = function (pattern) {
  assert(typeof pattern === 'string', 'Only strings can be defined.');
  pattern = pattern
    .replace(/(\/)+/g, '\/')
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\(\)/g, '');

  return Define(this.root, pattern.split('/'), this.flags);
};

Trie.prototype.match = function (path) {
  if (path[0] === '/') path = path.slice(1);
  var frags = path.split('/');
  var result = {params: {}, node: null};
  var node = this.root;
  var child = null;
  var frag = '';

  while (frags.length) {
    frag = safeDecodeURIComponent(frags.shift());
    if (frag === false) return null;
    child = node._nodeState.childNodes[this.flags ? frag.toLowerCase() : frag];

    if (!child) {
      for (var i = 0, len = node._nodeState.regexChildNodes.length; i < len; i++) {
        var regex = node._nodeState.regexChildNodes[i];
        if (regex[2] && !regex[2].test(frag)) continue;
        if (regex[1]) result.params[regex[1]] = frag;
        child = regex[0];
        break;
      }
    }
    if (!child) return null;
    node = child;
  }
  if (!node._nodeState.endpoint) return null;

  result.node = node;
  return result;
};

function Define(parentNode, frags, flags) {
  var frag = frags.shift();
  var child = parseNode(parentNode, frag, flags);
  if (!frags.length) {
    child._nodeState.endpoint = true;
    return child;
  }
  return Define(child, frags, flags);
}

function NodeState(frag) {
  this.name = frag;
  this.endpoint = false;
  this.childNodes = Object.create(null);
  this.regexNames = Object.create(null);
  this.regexChildNodes = [];
}

function Node(frag) {
  Object.defineProperty(this, '_nodeState', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: new NodeState(frag)
  });
}

function parseNode(parentNode, frag, flags) {
  var node = null;
  var parameter = '';
  var childNodes = parentNode._nodeState.childNodes;
  var regexNames = parentNode._nodeState.regexNames;
  var regexChildNodes = parentNode._nodeState.regexChildNodes;

  // Is a simple string
  if (isValidSlug(frag)) {
    node = childNodes[frag] || new Node(frag);
    childNodes[frag] = node;
  } else {
    // Find a parameter name for the string
    frag = frag.replace(parameterReg, function (str) {
      parameter = str.slice(1);
      return '';
    });

    if (frag) frag = wrapRegex(frag);

    if (regexNames[frag] >= 0) node = regexChildNodes[regexNames[frag]][0];
    else {
      node = new Node(frag);
      regexChildNodes.push([node, parameter, frag && new RegExp(frag, flags)]);
      regexNames[frag] = regexChildNodes.length - 1;
    }
  }

  return node;
}

function safeDecodeURIComponent(string) {
  try {
    return decodeURIComponent(string);
  } catch (err) {
    return false;
  }
}

function isValidSlug(str) {
  return str === '' || slugReg.test(str);
}

function wrapRegex(str) {
  return (str[0] === '(' ? '^' : '^(') + str + (str[str.length - 1] === ')' ? '$' : ')$');
}
