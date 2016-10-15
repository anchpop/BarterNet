var app = require('express')();
var server = require('http').Server(app);
var swig = require('swig');
var path = require('path');
var express = require('express');

// view engine setup
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

app.use(express.static('dist'));

// server and routing
server.listen(Number(process.env.PORT || 5000));

app.get('/', function (req, res) {
  res.render('index');
});

users = [];

var io = require('socket.io')(server);
// socket.io demo
io.on('connection', function (socket) {
  socket.emit('server event', { foo: 'bar' });
  socket.on('client event', function (data) {
    console.log(data);
  });
  socket.on('login', function(data) {
    console.log("SERVER: Welcome, " + data.username);
    users.push(data);
  });
});


console.log("international barter network activated");
