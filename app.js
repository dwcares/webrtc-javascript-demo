var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var clients = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', function (socket) {
    socket.on('join', function (name) {
        console.log('Join:  ' + name);

        var numClients = clients.length;

        console.log(numClients + ' client(s)');

        if (numClients === 0) {
            console.log('Client ID ' + socket.id + ' joined');
            
            socket.emit('joined', socket.id);            
            clients.push({ id: socket.id, name: name});

        } else if (numClients === 1) {
            console.log('Client ID ' + socket.id + ' joined');
            
            socket.emit('joined', socket.id);
            socket.emit('join', clients[0].name, clients[0].id);
            socket.broadcast.emit('join', name, socket.id);
            
            clients.push({ id: socket.id, name: name});
            io.emit('ready');            
        } else { // max two clients
            socket.emit('full');
        }
    });

    socket.on('offer', (offer) => {
        console.log('offer: ' + offer);
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        console.log('answer: ' + answer);
        
        socket.broadcast.emit('answer', answer);
    })

    socket.on('candidate', (candidate)  => {
        console.log('candidate: ' + candidate);
        
        socket.broadcast.emit('candidate', candidate);        
    });

});

http.listen(port, function () {
    console.log('listening on *: ' + port);
});