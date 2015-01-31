var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));

// Gestion Home
app.get('/', function(req, res) {
    res.render('../template/home.ejs', {variable: 'koko'});
});

app.get('/janken', function(req, res) {
	res.render('../template/janken.ejs', {});
});

// Gestion 404
app.use(function(req, res, next){
    res.status('Content-Type', 'text/plain').send(404, 'Page introuvable !');
});

var server = app.listen(8080);

var io = require('socket.io').listen(server);

// Quand on client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {

    //socket.emit('message', 'Vous êtes bien connecté !');
    socket.broadcast.emit('message', {message: 'Nouvel arrivant'});

    socket.on('janken', function (janken) {
        //janken = ent.encode(janken);
        socket.broadcast.emit('janken', {janken: janken});
    }); 
});