var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



var logged = false;
var rooms = ['room1','room2','room3'];
var usernames = new Array();
var sess;

function requireLogin (req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/');
    }
}


app.get('/', function(req, res) {
    sess = req.session;
    sess.username;

    if(sess.username) {
        res.render('../template/home.ejs', {user: sess});
    } else {
        var no_connect = {};
        no_connect.username = "inconnu";
        res.render('../template/home.ejs', {user: no_connect});
    }
});

app.get('/janken', [requireLogin], function(req, res) {
    sess = req.session;
    res.render('../template/janken.ejs', {user: sess, people: usernames});
});

app.post('/login',function(req,res){
    sess = req.session;
    sess.username = req.body.username;
    usernames.push(sess.username);
    res.end('done');
});

app.post('/room',function(req,res){
    sess = req.session;
    sess.room = req.body.room;
    res.end('done');
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
        //sess = req.session;
        sess.room = room.room_id;
        //socket.join('room'+socket.room_id);
    });

    socket.on('leftRoom', function (user) {
        delete usernames[user.username];
        socket.broadcast.emit('userLeft', {username: user.username});
    });

    socket.on('roomJoined', function (koko) {
        socket.emit('newUserEmit', {user: sess});
        socket.broadcast.emit('newUserBroadcast', {user: sess});
    }); 

    socket.on('janken', function (janken) {
        //janken = ent.encode(janken);
        socket.broadcast.emit('janken', {janken: janken});
    }); 

});