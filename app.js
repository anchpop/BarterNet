var app = require('express')();
var server = require('http').Server(app);
var swig = require('swig');
var path = require('path');
var express = require('express');
const MongoClient = require('mongodb').MongoClient
require('dotenv').config()
var crypto = require('crypto');

// view engine setup
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

app.use(express.static('dist'));
app.use(express.static('public'));


app.get('/', function(req, res) {
    res.render('index');
});

users = [];

var io = require('socket.io')(server);

var db;
MongoClient.connect(process.env.MONGO_URI, (err, database) => {
  if (err) return console.log(err);
  db = database;
  server.listen(Number(process.env.PORT || 5000), () => {
    console.log('listening on 3000');
  }
  );
})

var startingBux = 10
var buxGiven = 10

function getUserByNick(nick) {
    var userscopy = users;
    for (var x = 0; x < userscopy.length; x++) {
        if (userscopy[x].username === nick) {
            return userscopy[x];
        }
    }
    return null;
}


checkIfUsernameTaken = function(username) {
    if (getUserByNick(username))
      return true;
    return false
}

removeUserFromList = function(username) {
  var i = users.indexOf(getUserByNick(username));
  if(i != -1) {
	   users.splice(i, 1);
  }
}

genHash = function(user)
{
  return crypto.createHash('md5').update(user).digest('hex');
}

addUser = function(userToAdd, callback)
{
  db.collection('users').save({user: userToAdd, hash: genHash(userToAdd), bux: startingBux}, (err, result) => {
    if (err) return console.log(err)
    callback(err, result);
  });
}

getUser = function(userToGet, callback)
{
   console.log("getting user " + userToGet);
   var r;
   db.collection('users').findOne({user: userToGet}, callback);
}

initUser = function(userToInit, callback)
{
  getUser(userToInit, function(err, doc)
  {
    if (err) return (console.log(err))
    if (doc != null)
    {
      console.log('user already created');
      console.log('bux: ' + doc.bux);
      callback(err, doc);
    }
    else {
      addUser(userToInit, (err, result) => {
      getUser(userToInit, callback);});
    }
  });
}

setBux = function(userToSet, amount)
{
  db.collection('users').updateOne({user: userToSet}, { $set: { bux : amount } });
}

addBux = function(userToAdd, amount, callback)
{
  getUser(userToAdd, (err, result) => {db.collection('users').updateOne({user: userToAdd}, { $set: { bux : 20 } }, callback); })
}


io.on('connection', function(socket) {

    var nick = "";

    socket.on('login', function(data) {
        if (data.username && !data.username.includes(" ") && data.username != 'BarterBot') {
            console.log("SERVER: Welcome, " + data.username);
            if (!checkIfUsernameTaken(users, data.username)) {
                users.push({username: data.username, socket: socket});
                nick = data.username;
                socket.join('bigchat')
                initUser(nick, function(err, doc) {
                  io.to('bigchat').emit('receiveMessage', {
                      sender: "BarterBot",
                      text: "Welcome to the International Barter Network, " + nick + ". You have "  + doc.bux + " Barterbux!"
                  });
                  socket.emit('barterbuckdate', {bux: doc.bux});
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
        io.to('bigchat').emit('receiveMessage', {
            sender: nick,
            text: data.message
        });
    });
    socket.on('givebux', function(data) {
      addBux(data.recipient, buxGiven, (err, result) => {
        if (err) return (console.log(err));
        for (i = 0; i < users.length; i++)
        {
          if (users[i].username == data.recipient)
          {
            users[i].socket.emit('receiveMessage', {
                sender: 'BarterBot',
                text: nick + ' has given you ' + buxGiven + ' Barterbux!'
            });
            users[i].socket.emit('barterbuckChange', {bux: buxGiven})
          }
        }
        socket.emit('receiveMessage', {
            sender: 'BarterBot',
            text: 'You have given ' + data.recipient + " " + buxGiven + ' Barterbux!'
        });
      });
    })
    socket.on('disconnect', function() {
      if (nick)
      {
        io.to('bigchat').emit('receiveMessage', {
            sender: 'BarterBot',
            text: nick + ' has disconnected!'
        })
        removeUserFromList(nick);
      }
    });
});
