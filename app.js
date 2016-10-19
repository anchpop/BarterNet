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


checkIfUsernameTaken = function(users, username) {
    for (i = 0; i < users.length; i++) {
        if (users[i].username === username)
            return true;
    }
    return false;
}

removeuser = function(users, username) {
  var copyusers = users;
    for (i = 0; i < copyusers.length; i++) {
        if (copyusers[i].username === username)
          users .splice(i, 1);
          return;
    }
}


io.on('connection', function(socket) {

    var nick = "";



    socket.emit('server event', {
        foo: 'bar'
    });
    socket.on('client event', function(data) {
        console.log(data);
    });
    socket.on('login', function(data) {
        if (data.username && !data.username.includes(" ") && data.username != 'BarterBot') {
            console.log("SERVER: Welcome, " + data.username);
            if (!checkIfUsernameTaken(users, data.username)) {
                users.push(data);
                nick = data.username;
                socket.join('bigchat')
                io.to('bigchat').emit('receiveMessage', {
                    sender: "BarterBot",
                    text: "Welcome to the International Barter Network, " + nick
                });
            } else {
                socket.emit('receiveMessage', {
                    sender: 'BarterBot',
                    text: 'someone already took that name!'
                })
                socket.disconnect();
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
    socket.on('disconnect', function() {
        io.to('bigchat').emit('receiveMessage', {
            sender: 'BarterBot',
            text: nick + ' has disconnected!'
        })
        removeuser(users, nick);
    });
});




console.log("international barter network activated");
