import Phaser from 'phaser';
import {io} from "socket.io-client";
import { addText, colorTransition, replaceText, shakeScreen } from '../common';

export default class GameScene extends Phaser.Scene {
    constructor() {
		super('game');
	}

    preload () {
    }

    create(data) {
        
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        if (data.fadeIn){
            // wrap this line inside this if block
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }

        console.log(data.players);

        // socket creation
        const socket = data.socket;
        console.log(socket);
        
        // --------------------------------------------    Game Start     ---------------------------------------------------------

        // must initialize the board as zero for every player

        // make a small grid of 20 boxes
        const boxes = [];
        const clientData = [];

        for (let i = 0; i < 4; i++) {
            boxes.push([]);
            for (let j = 0; j < 5; j++) {
                const box = this.add.sprite((j * width / 6) + 320, (i * height / 4) + 120, 'menu-box').setInteractive();
                box.scale = 0.25;
                let name = '{' + (j + 1) + ',' + (i + 1) + '}';
                var value = 0;
                const box_value = addText(this, box, value, '28px', '#0f0');
                box.box_value = box_value; // Store box_value as a property of box

                box.on('pointerdown', () => {
                    var num = parseInt(box.box_value.text); // Access box_value from the property of box
                    var num = num + 1;
                    replaceText(box, box.box_value, num.toString()); // Access box_value from the property of box
                    colorTransition(this, box, 0xffffff, data.player.color);

                    // Update clientData for the corresponding box
                    const boxIndex = i * 5 + j;
                    clientData[boxIndex].troops = num;

                    // Send updated data to the server
                    socket.emit('clientTurnEnd', clientData);
                });

                // Initialize clientData with box name and initial troops value
                const boxData = { box: name, troops: value };
                clientData.push(boxData);

                boxes[i].push(box);
            }
        }
        
        // --------------------------------------------    Each Turn     --------------------------------------------------

        // this is where the data within the boxes should be updated with each call
        socket.on('serverTurnEnd', (updatedClientData) => {
            console.log(updatedClientData);
            // Update the values of the boxes based on the updated clientData received from the server
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 5; j++) {
                    const boxIndex = i * 5 + j; // Calculate the index of the box in 1D array
                    const num = updatedClientData[boxIndex].troops; // Get the updated troops value from updatedClientData
                    replaceText(boxes[i][j], boxes[i][j].box_value, num.toString()); // Update the text on the box with the new value
                }
            }
        });
    }

}