var express = require('express');

var app = express();

// Gestion Home
app.get('/', function(req, res) {
    res.render('template/home.ejs', {variable: 6});
});

app.get('/koko', function(req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.end('Koko man');
});

// Gestion 404
app.use(function(req, res, next){
    res.status('Content-Type', 'text/plain').send(404, 'Page introuvable !');
});

app.listen(8080);