const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join', (room) => {
        socket.join(room);
        socket.to(room).emit('user-connected', socket.id);

        socket.on('signal', data => {
            io.to(data.to).emit('signal', {
                from: socket.id,
                signal: data.signal
            });
        });

        socket.on('disconnect', () => {
            socket.to(room).emit('user-disconnected', socket.id);
        });
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
