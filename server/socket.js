const rooms = {};

module.exports = function(io) {
    io.on('connection', (socket) => {
        socket.on('createRoom', () => {
            const roomCode = generateRoomCode();
            rooms[roomCode] = { players: 1 };
            socket.join(roomCode);
            socket.roomCode = roomCode;
            socket.player = 1;
            socket.host = true;
            socket.emit('roomCreated', roomCode);
        });

        socket.on('joinRoom', (roomCode) => {
            const room = rooms[roomCode];
            if (room) {
                socket.roomCode = roomCode;
                socket.host = false;
                if (room.players < 4) {
                    room.players += 1;
                    socket.player = room.players;
                    socket.emit('roomJoined', roomCode);
                    socket.to(roomCode).emit('playerCount', room.players);
                } else {
                    socket.emit('error', "This room is already full!");
                }
            } else {
                socket.emit('error', "This is not a valid room code!");
            }
        });

        socket.on('getPlayerCount', () => {
            const room = rooms[socket.roomCode];
            if (room) {
                socket.emit('playerCount', room.players);
            }
        });

        socket.on('leaveRoom', () => {
            const room = rooms[socket.roomCode];
            if (room) {
                socket.leave(socket.roomCode);
                room.players -= 1;
                socket.to(socket.roomCode).emit('playerCount', room.players);
                socket.roomCode = null;
                socket.host = null;
                socket.player = null;
            }
        });

        socket.on('disconnect', () => {
            const room = rooms[socket.roomCode];
            if (room) {
                room.players -= 1;
                socket.to(socket.roomCode).emit('playerCount', room.players);
            }
        });
    });
};

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
        const index = Math.floor(Math.random() * chars.length);
        code += chars[index];
    }
    return code;
}