const rooms = {};

module.exports = function(io) {
    io.on('connection', (socket) => {

        socket.on('clientTurnEnd', (clientData) => {
            console.log(clientData);
            const roomCode = socket.data.roomCode;
            io.to(roomCode).emit('serverTurnEnd', clientData);
        });

        // ============================ TITLE ==============================

        socket.on('createRoom', (nickname) => {
            let roomCode = generateRoomCode();
            // generate a new key if it already exists
            while (roomCode in rooms) { 
                roomCode = generateRoomCode();
            }
            rooms[roomCode] = { players: 1 , started : false};
            socket.join(roomCode);
            socket.data.nickname = nickname;
            socket.data.roomCode = roomCode;
            socket.data.player = 1;
            socket.data.host = true;
            playersToSocket(socket, 'roomCreated', roomCode);
            console.log(rooms);
        });

        socket.on('joinRoom', (roomCode, nickname) => {
            const room = rooms[roomCode];
            if (room) {
                if (room.players < 4) {
                    socket.join(roomCode);
                    room.players += 1;
                    socket.data.nickname = nickname;
                    socket.data.roomCode = roomCode;
                    socket.data.player = room.players;
                    socket.data.host = false;
                    playersToSocket(socket, 'roomJoined', roomCode);
                    playersToRoom(socket, roomCode);
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
            const roomCode = socket.data.roomCode;
            rooms[roomCode].started = true;
            io.to(roomCode).emit('startedGame');
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
                    playersToRoom(socket, roomCode);
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
                    playersToRoom(socket, roomCode);
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
                    io.to(roomCode).emit('updateHost', socket.id);
                }
            }
        }
    }

    async function playersToSocket(socket, where, roomCode){
        const data = await getPlayers(roomCode);
        socket.emit(where, data);
    }

    async function playersToRoom(socket, roomCode){
        const data = await getPlayers(roomCode);
        console.log(data);
        socket.to(roomCode).emit('newPlayer', data);
    }

    async function getPlayers(roomCode){

        const sockets = await io.in(roomCode).fetchSockets();
        const playerData = {}

        for (const socket of sockets) {
            playerData[socket.data.player] = {nickname : socket.data.nickname, host : socket.data.host, roomCode : socket.data.roomCode};
        }

        console.log(playerData);

        return playerData;
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