const rooms = {};

module.exports = function(io) {
    io.on('connection', (socket) => {

        // ============================ TITLE ==============================

        socket.on('createRoom', (nickname) => {
            let roomCode = generateRoomCode();
            // generate a new key if it already exists
            while (roomCode in rooms) { 
                roomCode = generateRoomCode();
            }
            rooms[roomCode] = { players: 1 , started : false, lastTurn : 0};
            socket.join(roomCode);
            socket.data.nickname = nickname;
            socket.data.roomCode = roomCode;
            socket.data.player = 1;
            socket.data.host = true;
            socket.data.color = assignColor(socket.data.player);
            playersToSocket(socket, 'roomCreated', roomCode);
            console.log(rooms);
        });

        socket.on('joinRoom', (roomCode, nickname) => {
            const room = rooms[roomCode];
            if (room) {
                if (room.players < 4) {
                    checkNickname(socket, roomCode, nickname);
                } else {
                    socket.emit('error', "This room is already full!");
                }
            } else {
                socket.emit('error', "This room no longer exists!");
            }
            console.log(rooms);
        });

        socket.on('checkRoomCode', (roomCode) => {
            if (rooms[roomCode]){
                socket.emit('getNickname', roomCode);
            } else {
                socket.emit('error', "This is not a valid room code!");
            }
        }); 

        // ============================ OPTIONS ==============================

        socket.on('startGame', () => {
            const roomCode = socket.data.roomCode;
            rooms[roomCode].started = true;
            rooms[roomCode].turn = 1;
            io.to(roomCode).emit('startedGame');
        });

        // ============================ GAME ==============================

        socket.on('setup', (clientData) => {
            const roomCode = socket.data.roomCode;
            socket.to(roomCode).emit('setupTerritories', clientData);
        });

        socket.on("update", (updateData) => {
            const roomCode = socket.data.roomCode;
            socket.to(roomCode).emit('serverUpdate', updateData);
        });

        socket.on("attackUpdate", (updateData) => {
            const roomCode = socket.data.roomCode;
            socket.to(roomCode).emit('serverAttackUpdate', updateData);
        });

        socket.on('endTurn', (number) => {
            console.log(`Player ${number} ended their turn!`);
            const roomCode = socket.data.roomCode;
            if (rooms[roomCode].lastTurn !== number){
                rooms[roomCode].lastTurn = number;
                rooms[roomCode].turn = (rooms[roomCode].turn % rooms[roomCode].players) + 1;
                io.to(roomCode).emit('nextTurn', rooms[roomCode].turn);
            }
        });

        socket.on('gameOver', () => {
            const roomCode = socket.data.roomCode;
            io.to(roomCode).emit('gameEnd', false);
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

                if (room.started){
                    io.to(roomCode).emit("gameEnd", true);
                }
            }
            console.log(rooms);
        });

    });

    async function resetPlayerNum(roomCode, playerNumLeft) {
        const sockets = await io.in(roomCode).fetchSockets();

        for (const socket of sockets) {
            if (socket.data.player > playerNumLeft) {
                socket.data.player--;
                socket.data.color = assignColor(socket.data.player);
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
        socket.to(roomCode).emit('newPlayer', data);
    }

    async function getPlayers(roomCode){

        const sockets = await io.in(roomCode).fetchSockets();
        const playerData = {}

        for (const socket of sockets) {
            playerData[socket.data.player] = {id : socket.id, playerNum: socket.data.player, nickname : socket.data.nickname, host : socket.data.host, roomCode : socket.data.roomCode, color : socket.data.color};
        }


        return playerData;
    }

    async function checkNickname(socket, roomCode, nickname){
        
        const players = await getPlayers(roomCode);
        let check = true;

        for (const key in players) {
            if (players[key].nickname === nickname){
                check = false;
            }
        }

        if (check) {
            const room = rooms[roomCode];
            if (room) {
                socket.join(roomCode);
                room.players += 1;
                socket.data.nickname = nickname;
                socket.data.roomCode = roomCode;
                socket.data.player = room.players;
                socket.data.host = false;
                socket.data.color = assignColor(socket.data.player);
                playersToSocket(socket, 'roomJoined', roomCode);
                playersToRoom(socket, roomCode);
            } else {
                socket.emit('error', "This room no longer exists!");
            }
        } else {
            socket.emit('error', "This nickname is already in use!");
        }
    }

    function assignColor(playerNum){
        
        switch (playerNum) {
            case 1:
                return 0xdd79b5; //pink
                break;
            case 2:
                return 0x1B4079; //blue
                break;
            case 3:
                return 0x8e579a; //purple
                break;
            case 4:    
                return 0x70798C; //gray
                break;
            default:
                return 0x808080;
                break;
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

