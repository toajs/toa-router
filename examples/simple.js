'use strict';
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT
var Toa = require('toa');
var Router = require('../index');

var mockPosts = [
  {
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
  }
];

var mockTasks = [
  {
    id: '0',
    title: 'task 1',
    content: 'content 1'
  }, {
    id: '1',
    title: 'task 2',
    content: 'content 2'
  }
];

var router = new Router('/api');

router.get('/', function (Thunk) {
  this.body = 'Hi, toa router';
});

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

router
  .define('/:type(posts|tasks)/:id([0-9]+)')
  .get(function (Thunk) {
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
  .post(function (Thunk) {
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
  .del(function (Thunk) {
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

var app = Toa(function (Thunk) {
  return router.route(this, Thunk);
});

app.listen(3000);

function resJSON(data) {
  return {
    data: data,
    timestamp: Date.now()
  };
}
