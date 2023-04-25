import Phaser from 'phaser';
import {io} from "socket.io-client";
import { fadeOut, buttonPress, limitedPrompt } from '../common';


export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('title');
	}
    
    preload () {
        this.load.image('title', "assets/images/title.png");
        this.load.image('background', 'assets/images/title_bg.png');
        
        this.load.atlas('title-atlas', 'assets/atlas/title/buttons.png', 'assets/atlas/title/buttons.json');
        this.load.audio('button-press-sound', 'assets/audio/button-press.mp3');

        this.load.json('hitboxes', 'assets/test.json');
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

        // const hitbody = this.matter.add.fromPhysicsEditor(width / 2, height / 6, this.cache.json.get('hitboxes').title);
        // const hitbody = this.matter.add.fromPhysicsEditor(width / 2, height / 6, this.cache.json.get('hitboxes')["menu-box"]);
        // const title = this.add.sprite(width / 2, height / 6, 'title', null, hitbody);
        // const hitboxes = this.cache.json.get('hitboxes');

        function sortPointsClockwise(points) {
            const centroid = {
              x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
              y: points.reduce((sum, p) => sum + p.y, 0) / points.length
            };
            
            points.sort((a, b) => {
              const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
              const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
              
              if (angleA < angleB) return -1;
              if (angleA > angleB) return 1;
              
              // if angles are equal, break the tie by distance to centroid
              const distanceA = Math.sqrt((a.x - centroid.x)**2 + (a.y - centroid.y)**2);
              const distanceB = Math.sqrt((b.x - centroid.x)**2 + (b.y - centroid.y)**2);
              return distanceA - distanceB;
            });
            
            return points;
        }



        const points = [].concat(...this.cache.json.get('hitboxes').title.fixtures[0].vertices)
        const vertices = sortPointsClockwise(points)
        console.log(vertices)

        // Create the body using the vertices
        // var body = this.matter.bodies.fromVertices(0, 0, vertices, null);
        const title = this.matter.add.sprite(width / 2, height / 6, 'title');
        const body = this.matter.bodies.fromVertices(width / 2, height / 6, vertices, {"isStatic": true});
        body.scale = 1.5;
        title.setExistingBody(body);
        title.scale = 1.5;
        title.setInteractive();
        title.on('pointerdown', () => {

            console.log("Clicked!");
        });


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
                if (input.node.value === '') {
                    input.node.value = 'Enter Code';
                }
                input.node.blur();
            }
        });

        // --------------------------------------------    Buttons     ---------------------------------------------------------
        
        const hostBtn = this.add.sprite(width / 3, 10 * height / 21, 'title-atlas', 'host-button-up').setInteractive();
        hostBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            buttonPress('title-atlas', 'host', hostBtn);

            const nickname = limitedPrompt("What's your username? (9 characters max)", 9);
            if (nickname != null){
                socket.emit('createRoom', nickname);
            }
            
        });
        
        const joinBtn = this.add.sprite(2 * width / 3, 3 * height / 7, 'title-atlas', 'join-button-up').setInteractive();
        joinBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            buttonPress('title-atlas', 'join', joinBtn);

            const nickname = limitedPrompt("What's your username? (9 characters max)", 9);
            if (nickname != null){
                socket.emit('joinRoom', input.node.value, nickname);
            }
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
            alert(message);
        });

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(300, 0, 0, 0)
        }
    }
}