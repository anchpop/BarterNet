var app = require('express')();
var server = require('http').Server(app);
var swig = require('swig');
var path = require('path');
var express = require('express');

// view engine setup
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

app.use(express.static('dist'));
app.use(express.static('public'));

// server and routing
server.listen(Number(process.env.PORT || 5000));

app.get('/', function(req, res) {
    res.render('index');
});

users = [];

var io = require('socket.io')(server);
// socket.io demo
io.on('connection', function(socket) {

    var nick = "";


    socket.emit('server event', {
        foo: 'bar'
    });
    socket.on('client event', function(data) {
        console.log(data);
    });
    socket.on('login', function(data) {
        if (data.username && !data.username.includes(" ") && data.username != 'server') {
            console.log("SERVER: Welcome, " + data.username);
            if (true) //!users.include(data))
            {
                users.push(data);
                nick = data.username;
                socket.join('bigchat')
            } else {
                socket.emit('receiveMessage', {
                    sender: 'server',
                    message: 'someone already took that name!'
                })
            }
        }

    });
    socket.on('sendMessage', function(data) {
        console.log("SERVER: USER " + nick + " JUST SENT " + data.message);
        io.to('bigchat').emit('receiveMessage', {
            sender: nick,
            text: data.message
        });
    });
});


console.log("international barter network activated");
