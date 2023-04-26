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
            "20": { "sprite" : null, "adjacent" : [] },
            "21": { "sprite" : null, "adjacent" : [] },
            "22": { "sprite" : null, "adjacent" : [] },
            "23": { "sprite" : null, "adjacent" : [] },
            "24": { "sprite" : null, "adjacent" : [] }
          }
	}

    preload () {
        this.turn = 1;
        this.playerGroups = {};    
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
        
        renderTerritories(this, 4, 6);
        if (this.myPlayer.host) {
            randomizeTerritories(this, socket, this.mapData, data.players);
            for (const key in this.mapData){
                this.mapData[key].sprite.setInteractive();
            }
        }

        socket.on('setupTerritories', (updatedMapData) => {
            for (let i = 0; i < Object.keys(data.players).length; i++){
                this.playerGroups[i+1] = [];
            }

            for (const key in updatedMapData){
                const currBox = this.mapData[key].sprite;
                const updatedBoxData = updatedMapData[key];
                replaceText(currBox, currBox.textObj, updatedBoxData.troops.toString());
                colorTransition(this, currBox, currBox.data.color, updatedBoxData.color);
                currBox.data.troops = updatedBoxData.troops;
                currBox.data.color = updatedBoxData.color;
                currBox.data.owner = updatedBoxData.owner;
                this.playerGroups[updatedBoxData.owner].push(currBox.data.id);
            }
        });

        // --------------------------------------------    Game Start     ---------------------------------------------------------

        const nextBtn = this.add.sprite(1835, 975, 'options-atlas', 'back-button-up').setInteractive();
        nextBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            socket.emit('endTurn');
        });

        socket.on('nextTurn', (turnNum) => {
            this.turn = turnNum;

            if (data.players[this.turn].id === this.myPlayer.id) {
                console.log("ITS MY TURRN!!!!!!");
                for (const key in this.mapData){
                    this.mapData[key].sprite.setInteractive();
                }
                //TODO make player groups and make them interactable
            } else {
                for (const key in this.mapData){
                    
                    this.mapData[key].sprite.disableInteractive();
                    console.log(this.mapData[key].sprite);
                }
            }
        });

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

const renderTerritories = (scene, rows, cols) => {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            
            const box = scene.add.sprite((j * scene.sys.game.config.width / 7) + 274, (i * scene.sys.game.config.height / 5) + 120, 'menu-box');
            const box_value = addText(scene, box, 0, '28px', '#0f0');
            
            box.scale = 0.25;
            box.data = {};
            box.data.id =  (i * cols + j) + 1;
            box.data.owner = null;
            box.data.color = 0xffffff;
            box.data.troops = 0;
            box.textObj = box_value; // Store box_value as a property of box
            
            scene.mapData[box.data.id].sprite = box;

            if (j > 0){ // left
                scene.mapData[box.data.id - 1].adjacent.push(box);
            }
            if (j < cols - 1){ // right
                scene.mapData[box.data.id + 1].adjacent.push(box);
            }
            if (i > 0){ // above
                scene.mapData[box.data.id - cols].adjacent.push(box);
            }
            if (i < rows - 1){ //below
                scene.mapData[box.data.id + cols].adjacent.push(box);
            }

        }
    }
}

const randomizeTerritories = (scene, socket, mapData, players) => {
    const numTerritories = Object.keys(mapData).length;
    const numPlayers = Object.keys(players).length;

    for (let i = 1; i < numPlayers + 1; i++){
        scene.playerGroups[i] = [];
    }

    for (let i = 0; i < numTerritories / numPlayers; i++){
        for (let j = 1; j < numPlayers + 1; j++){

            let num = Math.floor(Math.random() * numTerritories) + 1;
            let currSprite = mapData[num].sprite;

            while (currSprite.data.owner != null) {
                num = (num % numTerritories) + 1;
                currSprite = mapData[num].sprite;
            }
            currSprite.data.owner = j;
            colorTransition(scene, currSprite, currSprite.data.color, players[j].color);
            currSprite.data.color =  players[j].color;
            scene.playerGroups[j].push(currSprite.data.id);
        }
    }

    // Send updated data to the server
    const newData = {};
    for (const key in mapData){
        newData[key] = mapData[key].sprite.data;
    }

    socket.emit('setup', newData);
}