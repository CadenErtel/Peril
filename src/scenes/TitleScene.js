import Phaser from 'phaser';
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

        let image = this.add.image(0, 0, 'background').setOrigin(0,0);
        image.displayWidth = width;
        image.displayHeight = height;
        
        this.add.image(width / 2, height / 6, 'title').scale = 1.5;

        // --------------------------------------------    Text Field     ---------------------------------------------------------
        
        const input = this.add.dom(2 * width / 3, 11 * height / 21, 'input').setInteractive();
        input.node.setAttribute('id', 'join-game-field');
        input.node.setAttribute('maxlength', '7');
        input.node.value = 'Enter Code';

        input.addListener('pointerdown');
        input.on('pointerdown', () => {
            if (input.node.value === 'Enter Code') {
                input.node.value = '';
            }
        });

        //always make the string typed uppercase
        input.addListener('input');
        input.on('input', (event) => {
            event.target.value = event.target.value.toUpperCase();
        });

        // Allows the unfocusing of the text field
        this.input.on('pointerdown', (_, gameObjects) => {
            // Check if the click occurred outside of the input field
            const clickedOutsideInput = !gameObjects.find(gameObject => gameObject.node === input.node);
        
            // If the click occurred outside of the input field, unfocus it
            if (clickedOutsideInput) {
                input.node.blur();
            }
        });

        // --------------------------------------------    Buttons     ---------------------------------------------------------
        
        const hostBtn = this.add.sprite(width / 3, 10 * height / 21, 'title-atlas', 'host-button-up').setInteractive();
        hostBtn.on('pointerdown', () => {
            socket.emit('createRoom');

            this.sound.play('button-press-sound');
            buttonPress('title-atlas', 'host', hostBtn);
        });
        
        const joinBtn = this.add.sprite(2 * width / 3, 3 * height / 7, 'title-atlas', 'join-button-up').setInteractive();
        joinBtn.on('pointerdown', () => {  
            socket.emit('joinRoom', input.node.value);
            
            this.sound.play('button-press-sound');
            buttonPress('title-atlas', 'join', joinBtn);
        });

        socket.on('roomCreated', (roomCode) => {
            console.log(`Room created with code ${roomCode}`);
            fadeOut('options', this, {socket : socket, roomCode : roomCode, currPlayers : 1});
        });
        
        socket.on('roomJoined', (data) => {
            console.log(`Room joined with code ${data[0]}`);
            fadeOut('options', this, {socket : socket, roomCode : data[0], currPlayers : data[1]});
        });
        
        socket.on('error', (message) => {
            alert(message);
        });

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }
    }
}