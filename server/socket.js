module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('message', (message) => {
            console.log(`A user sent a message : ${message}`);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
}