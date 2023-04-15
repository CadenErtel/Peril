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
            rooms[roomCode] = { players: 1 , started : false};
            socket.join(roomCode);
            socket.data.roomCode = roomCode;
            socket.data.player = 1;
            socket.data.host = true;
            socket.emit('roomCreated', roomCode);
            console.log(rooms);
        });

        socket.on('joinRoom', (roomCode) => {
            const room = rooms[roomCode];
            if (room) {
                if (room.players < 4) {
                    socket.join(roomCode);
                    socket.data.roomCode = roomCode;
                    room.players += 1;
                    socket.data.player = room.players;
                    socket.data.host = false;
                    socket.emit('roomJoined', [roomCode, room.players , socket.data.host]);
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
            const roomCode = socket.data.roomCode;
            const room = rooms[roomCode];
            if (room) {
                room.players -= 1;
                socket.leave(roomCode);
                resetPlayerNum(roomCode, socket.data.player);
                //if there are no more players then delete the room
                if (room.players === 0){
                    delete rooms[roomCode];
                // else update the rooms player count
                } else {
                    socket.to(roomCode).emit('newPlayer', room.players);
                }
                socket.data.roomCode = null;
                socket.data.host = null;
                socket.data.player = null;
            }
            console.log(rooms);
        });

        socket.on('disconnect', () => {
            const roomCode = socket.data.roomCode;
            const room = rooms[roomCode];
            if (room) {
                room.players -= 1;
                socket.leave(roomCode);
                resetPlayerNum(roomCode, socket.data.player);
                //if there are no more players then delete the room
                if (room.players === 0){
                    delete rooms[roomCode];
                // else update the rooms player count
                } else {
                    socket.to(roomCode).emit('newPlayer', room.players);
                }
                socket.data.roomCode = null;
                socket.data.host = null;
                socket.data.player = null;
            }
            console.log(rooms);
        });

    });

    async function resetPlayerNum(roomCode, playerNumLeft) {
        const sockets = await io.in(roomCode).fetchSockets();

        for (const socket of sockets) {
            if (socket.data.player > playerNumLeft) {
                socket.data.player--;
                if (socket.data.player === 1){
                    socket.data.host = true;
                }
            }
        }
    }
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