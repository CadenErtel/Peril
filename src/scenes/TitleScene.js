import Phaser from 'phaser';
import {io} from "socket.io-client";
let socket;


export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('title');
	}
    
    preload () {
        this.load.image('title', "assets/images/title.png");
        this.load.image('background', 'assets/images/title_bg.png');
        
        this.load.atlas('atlas', 'assets/atlas/title/buttons.png', 'assets/atlas/title/buttons.json');
        this.load.audio('button-press-sound', 'assets/audio/button-press.mp3');
    }
    
    create() {

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
            
            socket.on('message', (data) => {
                console.log('Received message:', data);
            });
            
            // Send a message to the server
            socket.emit('message', 'Hello from the client');
        }

        // --------------------------------------------    Static Images    -------------------------------------------------------

        let image = this.add.image(0, 0, 'background').setOrigin(0,0);
        image.displayWidth = window.innerWidth;
        image.displayHeight = window.innerHeight;
        
        this.add.image(window.innerWidth / 2, window.innerHeight / 6, 'title').scale = 1.5;

        // --------------------------------------------    Text Field     ---------------------------------------------------------
        
        const input = this.add.dom(2 * window.innerWidth / 3, 11 * window.innerHeight / 21, 'input').setInteractive();
        input.node.setAttribute('id', 'join-game-field');
        input.node.setAttribute('maxlength', '7');
        input.node.value = 'Enter Code';

        input.addListener('pointerdown');
        input.on('pointerdown', () => {
            if (input.node.value === 'Enter Code') {
                input.node.value = '';
            }
        });
        
        input.addListener('keydown');
        // When the user presses "Enter", log the text to the console
        input.on('keydown', (event) => {
            if (event.key === 'Enter') {
                console.log(input.node.value);
                input.node.value = '';
            }
        });

        // --------------------------------------------    Buttons     ---------------------------------------------------------

        const button_press_sound = this.sound.add('button-press-sound');
        
        const button1 = this.add.sprite(window.innerWidth / 3, 10 * window.innerHeight / 21, 'atlas', 'host-button-up').setInteractive();
        button1.on('pointerdown', () => {
            
            button_press_sound.play();
            buttonPress('host', button1);
            fadeOut('gamestart', this);
        });
        
        const button2 = this.add.sprite(2 * window.innerWidth / 3, 3 * window.innerHeight / 7, 'atlas', 'join-button-up').setInteractive();
        button2.on('pointerdown', () => {
            button_press_sound.play();
            buttonPress('join', button2);
            fadeOut('gamestart', this);
        });
        
        const buttonPress = (button_name, currentButton) => {

            currentButton.anims.create({
                key: 'button-press',
                frames: [
                    { key: 'atlas' , frame : `${button_name}-button-up`},
                    { key: 'atlas' , frame : `${button_name}-button-down`},
                    { key: 'atlas' , frame : `${button_name}-button-up`}
                ],
                frameRate: 45,
                repeat: 0
            });

            currentButton.anims.play("button-press");

        }

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        const fadeOut = (nextScene, currentScene) => {
            currentScene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
                console.log('Fade out complete for button:', nextScene);
                currentScene.scene.start(nextScene, { fadeIn: true });
            }, currentScene);
            
            currentScene.cameras.main.fadeOut(250);
        }
        
        
    }
}