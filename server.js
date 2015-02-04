var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



var logged = false;
var rooms = new Array();
var usernames = new Array();
var sess;

function requireLogin (req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/');
    }
}

Array.prototype.unset = function(val){
    var index = this.indexOf(val)
    if(index > -1){
        this.splice(index,1)
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
    //sess = req.session;
    //console.log('room '+sess.room, rooms[sess.room]);
    res.render('../template/janken.ejs', {user: sess, people: rooms[sess.room]});
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

    // Lorsque l'utilisateur a cliqué sur une room dans la HOME
    socket.on('joinRoom', function (room) {
        sess.room = room.room_id;
        if(!rooms[sess.room]) {
            rooms[sess.room] = new Array();
        }
        rooms[sess.room].push(sess.username);
    });

    // Lorsque l'utilisateur quitte une room
    socket.on('leftRoom', function (user) {
        console.log('user',user);
        console.log('before delete', rooms[sess.room]);
        rooms[sess.room].unset(sess.username);
        // if(rooms[sess.room][sess.username]) {
        //     rooms[sess.room].unset(sess.username);
        // }
        console.log('after delete', rooms[sess.room]);
        socket.leave('room'+sess.room);
        socket.broadcast.emit('userLeft', {username: user.username});
    });

    // Lorsqu'un utilisateur a rejoint une room
    socket.on('roomJoined', function () {
        socket.emit('newUserEmit', {user: sess});
        socket.join('room'+sess.room);
        socket.broadcast.to('room'+sess.room).emit('newUserBroadcast', {user: sess});
    }); 

    // Lorsque le pierre feuille ciseaux démarre
    socket.on('janken', function (janken) {
        //janken = ent.encode(janken);
        socket.broadcast.emit('janken', {janken: janken});
    }); 

});