var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;


app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', function(socket) {
    console.log('new connection ' + socket);
           
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});