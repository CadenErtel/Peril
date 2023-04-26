import Phaser from 'phaser';
import { addText, colorTransition, replaceText, shakeScreen } from '../common';

export default class GameScene extends Phaser.Scene {
    constructor() {
		super('game');
        this.myPlayer = null;
        this.mapData = 
        {
            "1": { "sprite" : null, "adjacent" : [] },
            "2": { "sprite" : null, "adjacent" : [] },
            "3": { "sprite" : null, "adjacent" : [] },
            "4": { "sprite" : null, "adjacent" : [] },
            "5": { "sprite" : null, "adjacent" : [] },
            "6": { "sprite" : null, "adjacent" : [] },
            "7": { "sprite" : null, "adjacent" : [] },
            "8": { "sprite" : null, "adjacent" : [] },
            "9": { "sprite" : null, "adjacent" : [] },
            "10": { "sprite" : null, "adjacent" : [] },
            "11": { "sprite" : null, "adjacent" : [] },
            "12": { "sprite" : null, "adjacent" : [] },
            "13": { "sprite" : null, "adjacent" : [] },
            "14": { "sprite" : null, "adjacent" : [] },
            "15": { "sprite" : null, "adjacent" : [] },
            "16": { "sprite" : null, "adjacent" : [] },
            "17": { "sprite" : null, "adjacent" : [] },
            "18": { "sprite" : null, "adjacent" : [] },
            "19": { "sprite" : null, "adjacent" : [] },
            "20": { "sprite" : null, "adjacent" : [] }
          }
	}

    preload () {
        this.boxes = [];
        this.clientData = [];        
    }
    
    create(data) {
        
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        const socket = data.socket;
        
        if (data.fadeIn){
            // wrap this line inside this if block
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }
        
        // find curr player
        for (let i = 0; i < Object.keys(data.players).length; i++){
            if (socket.id === data.players[i+1].id){
                this.myPlayer = data.players[i+1];
            }
        }
        
        // --------------------------------------------    Static Objects     --------------------------------------------------
        const rows = 4;
        const cols = 5;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                
                const box = this.add.sprite((j * width / 6) + 320, (i * height / 5) + 120, 'menu-box').setInteractive();
                const box_value = addText(this, box, 0, '28px', '#0f0');
                
                box.scale = 0.25;
                box.data = {};
                box.data.id =  (i * cols + j) + 1;
                box.data.owner = null;
                box.data.color = 0xffffff;
                box.data.troops = 0;
                box.textObj = box_value; // Store box_value as a property of box
                
                this.mapData[box.data.id].sprite = box;

                if (j > 0){ // left
                    this.mapData[box.data.id - 1].adjacent.push(box);
                }
                if (j < cols - 1){ // right
                    this.mapData[box.data.id + 1].adjacent.push(box);
                }
                if (i > 0){ // above
                    this.mapData[box.data.id - cols].adjacent.push(box);
                }
                if (i < rows - 1){ //below
                    this.mapData[box.data.id + cols].adjacent.push(box);
                }

            }
        }

        console.log(this.mapData);

        // --------------------------------------------    Game Start     ---------------------------------------------------------


        for (const key in this.mapData){
            const box = this.mapData[key].sprite;
            box.on('pointerdown', () => {
                let num = parseInt(box.textObj.text) + 1; // Access box_value from the property of box
                replaceText(box, box.textObj, num.toString()); // Access box_value from the property of box
                colorTransition(this, box, box.data.color, this.myPlayer.color);
    
                box.data.troops = num;
                box.data.color = this.myPlayer.color;
                box.data.owner = this.myPlayer.id;

                // Send updated data to the server

                const newData = {};
                for (const key in this.mapData){
                    newData[key] = this.mapData[key].sprite.data;
                }

                socket.emit('update', newData);
            });
        }
        
        // --------------------------------------------    Each Turn     --------------------------------------------------

        // this is where the data within the boxes should be updated with each call
        socket.on('serverUpdate', (updatedMapData) => {
            console.log(updatedMapData);
            // Update the values of the boxes based on the updated clientData received from the server

            for (const key in updatedMapData){
                const currBox = this.mapData[key].sprite;
                const updatedBoxData = updatedMapData[key];
                replaceText(currBox, currBox.textObj, updatedBoxData.troops.toString());
                colorTransition(this, currBox, currBox.data.color, updatedBoxData.color);
                currBox.data.troops = updatedBoxData.troops;
                currBox.data.color = updatedBoxData.color;
                currBox.data.owner = updatedBoxData.owner;
            }
        });
    }
}