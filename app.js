var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', function (socket) {
    socket.on('join', function (room) {
        console.log('Join room ' + room);

        var numClients = io.sockets.adapter.rooms[room] == undefined ? 0 : io.sockets.adapter.rooms[room].length;
        console.log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
            socket.join(room);
            console.log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, socket.id);

        } else if (numClients === 1) {
            console.log('Client ID ' + socket.id + ' joined room ' + room);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');
        } else { // max two clients
            socket.emit('full', room);
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