var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();

// Fonction pour vérifier qu'un utilisateur est loggé pour le rediriger
function requireLogin (req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/');
    }
}

// Fonction pour vider une entrée d'un tableau tout en la supprimant réellement
Array.prototype.unset = function(val){
    var index = this.indexOf(val)
    if(index > -1){
        this.splice(index,1)
    }
}

// Variables globales

var rooms = new Array();
var usernames = new Array();
var sess;

for (var r = 1; r < 4; r++) {
    rooms[r] = new Array();
}

// Gestion de l'application avec Express

app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'ssshhhhh',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
  sess = req.session;
  req.session.cookie.expires = false;
  next();
});



// Gestion des URL de l'application

app.get('/', function(req, res) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

    sess.username;
    sess.room;
    sess.is_home;

    if(sess.room != undefined) {
        rooms[sess.room].unset(sess.username);
        sess.room = undefined;
    }

    sess.is_home = 1;

    if(sess.username && sess.username != 'inconnu') {
        res.render('../template/home.ejs', {user: sess, rooms: rooms, usernames: usernames});
    } else {
        var no_connect = {};
        no_connect.username = "inconnu";
        res.render('../template/home.ejs', {user: no_connect, usernames: usernames});
    }
});

app.get('/janken', [requireLogin], function(req, res) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.render('../template/janken.ejs', {
        user: sess, 
        people: rooms[sess.room]
    });
});

// Récupération des données par formulaires

app.post('/login', function(req,res){
    sess.username = req.body.username;
    usernames.push(sess.username);
    res.end('done');
});

app.post('/quitGame', function(req,res){
    usernames.unset(sess.username);
    sess.username = 'inconnu';
    res.end('done');
});

app.post('/joinRoom',function(req,res){

    sess.room = req.body.room_id;
    
    if(rooms[sess.room].length < 2) {
        rooms[sess.room].push(sess.username);
        res.end('OK');
    } else {
        res.end('KO');
    }

});

app.post('/leftRoom',function(req,res){
    rooms[req.body.room_id].unset(sess.username);
    sess.room = undefined;
    res.end('done');
});

app.use(function(req, res, next) {
    res.status('Content-Type', 'text/plain').send(404, 'Page introuvable !');
});

// Démarrage du serveur

var server = app.listen(8080);

/*
*   SOCKET IO
*/

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

    // Lorsque l'utilisateur rentre un username, on prévient les autres utilisateurs
    socket.on('I_login', function (user) {
        socket.broadcast.emit('logged', {username : user.username});
    });

    socket.on('I_leaveGame', function (user) {
        /*if(sess.room != undefined) {
            socket.leave('room'+sess.room);
            socket.broadcast.to('room'+sess.room).emit('userLeft', {username: user.username});
        }*/
        
        socket.broadcast.emit('userLeaveGame', {username : user.username});
    });

    socket.on('I_joinRoom', function (room) {
        socket.broadcast.emit('infoRoom', {room_id : room.room_id});
    });

    // Lorsque l'utilisateur quitte une room
    socket.on('I_leftRoom', function (user) {
        socket.leave('room'+sess.room);
        socket.broadcast.to('room'+sess.room).emit('userLeft', {username: user.username});
        socket.broadcast.emit('infoLeftRoom', {room_id : user.room_id});
    });

    socket.on('I_onHome', function (user) {
        if(sess.room != undefined) {
            socket.leave('room'+sess.room);
            socket.broadcast.to('room'+sess.room).emit('userLeft', {username: user.username});
            socket.broadcast.emit('infoLeftRoom', {room_id : sess.room});
        }
    });

    // Lorsqu'un utilisateur a rejoint une room
    socket.on('I_roomJoined', function () {
        socket.emit('newUserEmit', {user: sess});
        socket.join('room'+sess.room);
        socket.broadcast.to('room'+sess.room).emit('newUserBroadcast', {user: sess});
        sess.is_home = 0;
    });

    socket.on('I_changeColor', function (infos) {
        socket.broadcast.to('room'+infos.room_id).emit('changeColorBroadcast', {color: infos.color});
    });

    // Lorsque le pierre feuille ciseaux démarre
    socket.on('I_janken', function (janken) {
        socket.broadcast.to('room'+janken.room_id).emit('janken', {janken: janken.play});
    });

    // Si l'utilisateur quitte la page en la fermant purement et simplement
    socket.on('disconnect', function () { 
        if(sess.room != undefined && sess.is_home == 0) {
            console.log(sess.username);
            socket.leave('room'+sess.room);
            socket.broadcast.to('room'+sess.room).emit('userLeft', {username: sess.username});
            socket.broadcast.emit('infoLeftRoom', {room_id : sess.room});
            socket.broadcast.emit('userLeaveGame', {username : sess.username});
        }
    });

});