import Phaser from 'phaser';
import Swal from 'sweetalert2';
import {io} from "socket.io-client";
import { fadeOut, buttonPress } from '../common';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('title');
	}
    
    preload () {
        this.load.image('title', "assets/images/title.png");
        this.load.image('background', 'assets/images/title_bg.png');
        
        this.load.atlas('title-atlas', 'assets/atlas/title/buttons.png', 'assets/atlas/title/buttons.json');
        this.load.audio('button-press-sound', 'assets/audio/button-press.mp3');
    }
    
    create(data) {
        
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        
        // --------------------------------------------    Socket IO    -------------------------------------------------------
        const socket = io("ws://localhost:8080", {
            reconnection: false, // Disable automatic reconnection
            reconnectionAttempts: 0, // Set maximum number of reconnection attempts to 0
        });
        
        if (socket) {
            // Handle Socket.io events
            socket.on('connect', () => {
                console.log('Connected to server');
            });
            
            socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });
        }

        // --------------------------------------------    Static Images    -------------------------------------------------------

        const image = this.add.image(0, 0, 'background').setOrigin(0,0);
        image.displayWidth = width;
        image.displayHeight = height;

        this.add.image(width / 2, height / 6, 'title').setOrigin(.5).setScale(1.5);

        // --------------------------------------------    Buttons     ---------------------------------------------------------
        
        const hostBtn = this.add.sprite(width / 3, height / 2 , 'title-atlas', 'host-button-up').setInteractive();
        hostBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            buttonPress('title-atlas', 'host', hostBtn);

            hostBtn.disableInteractive();
            joinBtn.disableInteractive();

            Swal.fire({
                backdrop: false,
                title: 'Enter your Nickname!',
                input: 'text',
                inputAttributes: {
                  maxlength: 9,
                },
                inputValidator: (value) => {
                    if (!value) {
                      return 'You need to write something!'
                    }
                },
                showCancelButton: true,
                confirmButtonText: 'Submit',
                cancelButtonText: 'Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log('Text entered:', result.value);
                    socket.emit('createRoom', result.value);
                }
                hostBtn.setInteractive();
                joinBtn.setInteractive();
            });

            
        });
        
        const joinBtn = this.add.sprite(2 * width / 3, height / 2, 'title-atlas', 'join-button-up').setInteractive();
        joinBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            buttonPress('title-atlas', 'join', joinBtn);

            hostBtn.disableInteractive();
            joinBtn.disableInteractive();
            

            Swal.fire({
                backdrop: false,
                title: 'Enter A Room Code!',
                input: 'text',
                inputAttributes: {
                    maxlength: 7
                },
                inputValidator: (value) => {
                    if (!value) {
                      return 'You need to write something!'
                    }
                },
                showCancelButton: true,
                confirmButtonText: 'Submit',
                cancelButtonText: 'Cancel',
            }).then((roomResult) => {
                if (roomResult.isConfirmed) {
                    Swal.fire({
                        backdrop: false,
                        title: 'Enter your Nickname!',
                        input: 'text',
                        inputAttributes: {
                          maxlength: 9,
                        },
                        inputValidator: (value) => {
                            if (!value) {
                              return 'You need to write something!'
                            }
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Submit',
                        cancelButtonText: 'Cancel',
                    }).then((nickName) => {
                        if (nickName.isConfirmed) {
                            console.log('Text entered:', nickName.value);
                            socket.emit('joinRoom', roomResult.value.toUpperCase(), nickName.value);
                        } else if (nickName.dismiss === Swal.DismissReason.cancel || nickName.dismiss === Swal.DismissReason.esc) {
                            hostBtn.setInteractive();
                            joinBtn.setInteractive();
                        }
                    });

                } else if (roomResult.dismiss === Swal.DismissReason.cancel || roomResult.dismiss === Swal.DismissReason.esc) {
                    hostBtn.setInteractive();
                    joinBtn.setInteractive();
                }
            })

           
        });

        socket.on('roomCreated', (players) => {
            console.log(`Room created with code ${players[1].roomCode}`);
            fadeOut('options', this, {socket : socket, players : players, host : true});
        });
        
        socket.on('roomJoined', (players) => {
            console.log(`Room joined with code ${players[1].roomCode}`);
            fadeOut('options', this, {socket : socket, players : players, host : false});
        });
        
        socket.on('error', (message) => {
            Swal.fire({
                title: 'Balls?!',
                text: message,
                icon: 'error',
                backdrop : false
            })
        });

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(300, 0, 0, 0)
        }
    }
}