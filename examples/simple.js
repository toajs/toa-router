'use strict';
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT
var Toa = require('toa');
var Router = require('../index');

var mockPosts = [{
  id: '0',
  title: 'post 1',
  content: 'content 1'
}, {
  id: '1',
  title: 'post 2',
  content: 'content 2'
}, {
  id: '2',
  title: 'post 3',
  content: 'content 3'
}];

var mockTasks = [{
  id: '0',
  title: 'task 1',
  content: 'content 1'
}, {
  id: '1',
  title: 'task 2',
  content: 'content 2'
}];

var router = new Router('/api');
var router2 = new Router();

router.get('', function() {
  this.body = 'Hi, toa router';
});

router
  .define('/:type(posts|tasks)')
  .get(function() {
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

router
  .define('/:type(posts|tasks)/:id([0-9]+)')
  .get(function() {
    var data = null;
    switch (this.params.type) {
      case 'posts':
        data = mockPosts[this.params.id];
        break;
      case 'tasks':
        data = mockTasks[this.params.id];
        break;
    }
    if (data) this.body = resJSON(data);
    else this.throw(404, this.path + ' is not found!');
  })
  .post(function() {
    var data = null;
    switch (this.params.type) {
      case 'posts':
        data = mockPosts[this.params.id];
        break;
      case 'tasks':
        data = mockTasks[this.params.id];
        break;
    }
    if (data) this.body = resJSON(data);
    else this.throw(404, this.path + ' is not found!');
  })
  .del(function() {
    var data = null;
    switch (this.params.type) {
      case 'posts':
        data = mockPosts[this.params.id];
        break;
      case 'tasks':
        data = mockTasks[this.params.id];
        break;
    }
    if (data) this.body = resJSON(data);
    else this.throw(404, this.path + ' is not found!');
  });

router2.get('/:others(*)', function() {
  this.body = 'Path is: ' + this.params.others;
});

var app = Toa(function() {
  return this.thunk.all.call(this, router.route(this), router2.route(this));
});

app.listen(3000);

function resJSON(data) {
  return {
    data: data,
    timestamp: Date.now()
  };
}
