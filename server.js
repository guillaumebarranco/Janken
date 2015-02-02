var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));

var logged = false;
var me;
var rooms = ['room1','room2','room3'];
var room_id;
var usernames = {};
var the_room_id;
var the_username;

app.get('/', function(req, res) {
	if(logged == false) {
		me = 'inconnu';
	}
	
    res.render('../template/home.ejs', {user: me});
});

app.get('/janken', function(req, res) {
	res.render('../template/janken.ejs', {username: the_username, room_id: the_room_id});
});

app.use(function(req, res, next) {
    res.status('Content-Type', 'text/plain').send(404, 'Page introuvable !');
});

var server = app.listen(8080);

var io = require('socket.io').listen(server);

// Quand on client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {

    socket.on('login', function (user) {
    	socket.username = user.username;
    	logged = true;
    	usernames[socket.username] = socket.username;
    	socket.emit('logged', {username : socket.username});
    });

    socket.on('joinRoom', function (room) {
    	the_room_id = socket.room_id;
    	the_username = socket.username;
    	socket.room_id = room.room_id;
    	//socket.join('room'+socket.room_id);
    });

    socket.on('roomJoined', function (username, room_id) {
        console.log(username);
        socket.username = username;
        socket.room_id = room_id;
        
        socket.emit('displayInfos', {username: socket.username, room: socket.room_id});
        socket.broadcast.emit('displayInfos', {username: socket.username, room: socket.room_id});
    }); 

    socket.on('janken', function (janken) {
        //janken = ent.encode(janken);
        socket.broadcast.emit('janken', {janken: janken});
    }); 

});