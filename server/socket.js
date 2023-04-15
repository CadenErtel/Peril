const rooms = {};

module.exports = function(io) {
    io.on('connection', (socket) => {

        // ============================ TITLE ==============================

        socket.on('createRoom', () => {
            let roomCode = generateRoomCode();
            // generate a new key if it already exists
            while (roomCode in rooms) { 
                roomCode = generateRoomCode();
            }
            rooms[roomCode] = { players: 1 };
            socket.join(roomCode);
            socket.roomCode = roomCode;
            socket.player = 1;
            socket.host = true;
            socket.emit('roomCreated', roomCode);
            console.log(rooms);
        });

        socket.on('joinRoom', (roomCode) => {
            const room = rooms[roomCode];
            if (room) {
                if (room.players < 4) {
                    socket.join(roomCode);
                    socket.roomCode = roomCode;
                    socket.host = false;
                    room.players += 1;
                    socket.player = room.players;
                    socket.emit('roomJoined', [roomCode, room.players , socket.host]);
                    socket.to(roomCode).emit('newPlayer', room.players);
                } else {
                    socket.emit('error', "This room is already full!");
                }

            } else {
                socket.emit('error', "This is not a valid room code!");
            }
            console.log(rooms);
        });

        // ============================ OPTIONS ==============================

        socket.on('startGame', () => {

        });

        // ============================ DISCONNECTS ==============================

        socket.on('leaveRoom', () => {
            const roomCode = socket.roomCode;
            const room = rooms[roomCode];
            if (room) {
                room.players -= 1;
                //if there are no more players then delete the room
                socket.leave(roomCode);
                if (room.players === 0){
                    delete rooms[roomCode];
                // else update the rooms player count
                } else {
                    socket.to(roomCode).emit('newPlayer', room.players);
                }
                socket.roomCode = null;
                socket.host = null;
                socket.player = null;
            }
            console.log(rooms);
        });

        socket.on('disconnect', () => {
            const roomCode = socket.roomCode;
            const room = rooms[roomCode];
            if (room) {
                room.players -= 1;
                //if there are no more players then delete the room
                if (room.players === 0){
                    delete rooms[roomCode];
                // else update the rooms player count
                } else {
                    socket.to(roomCode).emit('newPlayer', room.players);
                }
            }
            console.log(rooms);
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