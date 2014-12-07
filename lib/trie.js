'use strict';
// **Github:** https://github.com/toajs/toa-router
//
// **License:** MIT

var assert = require('assert');
var slugReg = /^[\w\.-]+$/;
var parameterReg = /^\:\w+\b/;

module.exports = Trie;

function Trie() {
  this.root = new Node('root');
}

Trie.prototype.define = function (pattern) {
  assert(pattern && typeof pattern === 'string', 'Only strings can be defined.');
  pattern = pattern
    .replace(/(\/)+/g, '\/')
    .replace(/^\//, '')
    .replace(/\/$/, '');

  return Define(this.root, pattern.split('/'));
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

    child = node.childNodes[frag];
    if (!child) {
      if (node.regex && !node.regex.test(frag)) return null;
      if (node.parameter) result.params[node.parameter] = frag;
      child = node.childNodes[''];
    }

    if (!child) return null;
    node = child;
  }

  result.node = node;
  return result;
};

function Define(parentNode, frags) {
  var frag = frags.shift();
  var child = parseNode(parentNode, frag);
  if (!frags.length) return child;
  return Define(child, frags);
}

function Node(frag) {
  this.name = frag;
  this.regex = '';
  this.parameter = '';
  this.childNodes = Object.create(null);
}

function parseNode(parentNode, frag) {
  var childNodes = parentNode.childNodes;

  // Is not a simple string
  if (!isValidSlug(frag)) {
    // Find a parameter name for the string
    frag = frag.replace(parameterReg, function (parameter) {
      parentNode.parameter = parameter.slice(1);
      return '';
    });

    if (frag) {
      if (frag[0] !== '(') frag = '(' + frag;
      if (frag[frag.length - 1] !== ')') frag = frag + ')';
      parentNode.regex = new RegExp('^' + frag + '$', 'i');
      frag = '';
    }
  }

  childNodes[frag] = childNodes[frag] || new Node(frag);
  return childNodes[frag];
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
