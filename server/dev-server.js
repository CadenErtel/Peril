const path = require("path");
const express = require("express");
const app = express();
const socketio = require("socket.io");
const socketEvents = require("./socket");

const DEV_PORT = process.env.DEV_PORT || 8081;

const startListening = () => {
    // start listening (and create a 'server' object representing our server)
    const server = app.listen(DEV_PORT, () => {
      console.log('Listening on ' + server.address().port);
    });
  
    const io = socketio(server);
    socketEvents(io);
  };
  
  async function bootApp() {
    await startListening();
  }
  
  bootApp();