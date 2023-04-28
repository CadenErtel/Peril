import Phaser from 'phaser';
import Swal from 'sweetalert2';
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
        this.load.image('forward-button-up', 'assets/images/forward-button-up.png');
        this.load.image('forward-button-down', 'assets/images/forward-button-down.png');
        this.load.image('options-button-up', 'assets/images/options-button-up.png');
        this.load.image('options-button-down', 'assets/images/options-button-down.png');
        
        this.turn = 1;
        this.stage = "deploy";
        this.playerGroups = {};
        
        this.numPlayers = Object.keys(this.scene.settings.data.players).length;
        
        this.arrows = this.add.group();
        // for each player make a sprite on the side
        // make an arrow that can move to each sprite
        const colors = [0xFF0000, 0x0000FF, 0xFFFF00, 0x00FF00];
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        const triangleHeight = 40; // set the height of the triangle
        const triangleWidth = 30; // set the width of the triangle base
        for (let i = 0; i < this.numPlayers; i++) {
            const playerIcon = this.add.circle(width - 75, ((i * height) / 10) + 375, 40, colors[i]);
            
            const triangle = this.add.triangle(
                width - 75 - (playerIcon.radius/* + triangleHeight*/), // x position of the triangle peak (to the left of the circle)
                ((i * height) / 10) + 375 + (triangleWidth / 2), // y position of the triangle peak (same as circle y position)
                -triangleHeight / 2, -triangleWidth / 2, // bottom left corner of the triangle
                -triangleHeight / 2, triangleWidth / 2, // top left corner of the triangle
                triangleHeight / 2, 0, // peak of the triangle
                0xffffff // color of the triangle
            );
            triangle.setVisible(false);
            this.arrows.add(triangle);
        }

        this.phaseText = this.add.group();

        this.add.graphics().fillStyle(0x606266, .7).fillRoundedRect((width / 2) - 250, height - 145, 500, 90, 10);
        const deployText = this.add.text(width / 2 - 145, height - 100, "Deploy", {fontSize : "24px"} ).setOrigin(.5);
        const attackText = this.add.text(width / 2, height - 100, "Attack", {fontSize : "24px"}).setOrigin(.5);
        const reinforceText = this.add.text(width / 2 + 150, height - 100, "Fortify", {fontSize : "24px"}).setOrigin(.5);
        const waitTurnText = this.add.text(width / 2, height - 100, "Waiting For Turn!", {fontSize : "36px"}).setOrigin(.5);

        deployText.setTint(0x00FF00);

        this.phaseText.add(deployText);
        this.phaseText.add(attackText);
        this.phaseText.add(reinforceText);
        this.phaseText.add(waitTurnText);
        this.phaseText.getChildren().forEach(sprite => {
            sprite.setVisible(false);
        })
        
    }
    
    create(data) {
        const socket = data.socket;
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }

        // --------------------------------------------    Static Objects     --------------------------------------------------
        
        const nextBtn = this.add.sprite(1835, 975, 'forward-button-up').setInteractive();
        const settingsButton = this.add.sprite(75, 75, 'options-button-up').setInteractive();

        // --------------------------------------------    Static Object Logic     --------------------------------------------------

        nextBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            // if not in the fortify stage change to next stage, else end turn
            
            const currText = this.phaseText.getChildren();
            
            if (this.stage === "deploy"){
                this.stage = "attack";
                
                currText[0].setTint(0xFFFFFF);
                currText[1].setTint(0x00FF00);
                console.log("go to attack");
                //colorTransition(this, attackText, 0x000000, 0x00FF00);
                //attackText.setTint(0x00FF00)
            }
            else if (this.stage === "attack"){
                this.stage = "fortify";
                console.log("go to fortify");
                currText[1].setTint(0xFFFFFF);
                currText[2].setTint(0x00FF00);
                attack();
            }
            else if (this.stage === "fortify") {
                this.stage = "deploy";
                console.log("go to next turn");
                currText[2].setTint(0xFFFFFF);
                currText[0].setTint(0x00FF00);
                fortify();
                socket.emit('endTurn');
            }
            
        });

        
        settingsButton.on('pointerdown', () => {
            this.sound.play('button-press-sound');
        });
        
        // --------------------------------------------    Game Start     ---------------------------------------------------------

        initialLoad(this, data.players, socket);
        
        renderTerritories(this, 4, 6);
        if (this.myPlayer.host) {
            randomizeTerritories(this, socket, this.mapData, data.players);
        }
        
        applyListeners(this);

        if (this.myPlayer.host) {
            deploy();
        }

        // --------------------------------------------    Socket Commands     ---------------------------------------------------------
        
        socket.on('setupTerritories', (updatedMapData) => {
            
            console.log(updatedMapData);
            
            for (let i = 0; i < this.numPlayers; i++){
                this.playerGroups[i+1] = this.add.group();
            }
            
            for (const key in updatedMapData){
                const currBox = this.mapData[key].sprite;
                const updatedBoxData = updatedMapData[key];
                replaceText(currBox, currBox.textObj, updatedBoxData.troops.toString());
                colorTransition(this, currBox, currBox.data.color, updatedBoxData.color);
                currBox.data.troops = updatedBoxData.troops;
                currBox.data.color = updatedBoxData.color;
                currBox.data.owner = updatedBoxData.owner;
                this.playerGroups[updatedBoxData.owner].add(currBox);
            }
        });
        

        socket.on('nextTurn', (turnNum) => {
            this.stage = "deploy"; //reset stage state
            this.arrows.getChildren()[this.turn-1].setVisible(false); //hide last players arrow

            //hide phase text every turn
            this.phaseText.getChildren().forEach(sprite => {
                sprite.setVisible(false);
            })

            this.turn = turnNum;
            this.arrows.getChildren()[this.turn-1].setVisible(true); //show current player arrow

            //if its the current clients turn
            if (data.players[this.turn].id === this.myPlayer.id) {
                console.log("ITS MY TURRN!!!!!!");

                //enable the sprites in that clients player group
                this.playerGroups[this.turn].getChildren().forEach(sprite => {
                    sprite.setInteractive();
                });

                //show the turn phasing text
                this.phaseText.getChildren().forEach((sprite, index) => {
                    if (index < 3){
                        sprite.setVisible(true);
                    }
                });

                //start deploy turn
                deploy();

            // else its not my turn
            } else {
                //disable all sprites
                for (const key in this.playerGroups){
                    this.playerGroups[key].getChildren().forEach(sprite => {
                        sprite.disableInteractive();
                    });
                }

                //show waiting for turn text
                this.phaseText.getChildren()[3].setVisible(true);
            }
        });

        
        
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

//TODO function that calcs hoy many troops a player has to add on turn, functionality that allows them to add
//TODO convert from squares to states 

const initialLoad = (scene, playerData, socket) => {

    scene.arrows.getChildren()[0].setVisible(true); //initial arrow

    for (let i = 0; i < scene.numPlayers; i++){
        if (socket.id === playerData[i+1].id){
            scene.myPlayer = playerData[i+1];
            if (i + 1 === 1){
                scene.phaseText.getChildren().forEach((sprite, index) => {
                    if (index < 3){
                        sprite.setVisible(true);
                    }
                });
            } else {
                scene.phaseText.getChildren()[3].setVisible(true);
            }
        }
    }
}

const applyListeners = (scene) => {
    for (const key in scene.mapData){
        const box = scene.mapData[key].sprite;
        box.on('pointerdown', () => {
            let num = parseInt(box.textObj.text) + 1; // Access box_value from the property of box
            replaceText(box, box.textObj, num.toString()); // Access box_value from the property of box
            colorTransition(scene, box, box.data.color, scene.myPlayer.color);

            box.data.troops = num;
            box.data.color = scene.myPlayer.color;
            box.data.owner = scene.myPlayer.id;
        });
    }
}

const renderTerritories = (scene, rows, cols) => {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            
            const box = scene.add.sprite((j * scene.sys.game.config.width / 7) + 274, (i * scene.sys.game.config.height / 5) + 120, 'menu-box').disableInteractive();
            const box_value = addText(scene, box, 1, '28px', '#0f0');
            
            box.scale = 0.25;
            box.data = {};
            box.data.id =  (i * cols + j) + 1;
            box.data.owner = null;
            box.data.color = 0xffffff;
            box.data.troops = 1;
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
        scene.playerGroups[i] = scene.add.group();
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
            scene.playerGroups[j].add(currSprite);
        }
    }

    for (let i = 0; i < numPlayers; i++) {
        
        const maxTroops = 40 - (8*(numPlayers-2));
        let currentTroops = numTerritories/numPlayers;

        const territories = scene.playerGroups[i+1].getChildren();
        const numPlayerTerr = territories.length;

        while (currentTroops < maxTroops){

            let territory = territories[Phaser.Math.Between(0, numPlayerTerr-1)]
            while (territory.data.troops > 5) {
                territory = territories[Phaser.Math.Between(0, numPlayerTerr-1)]
            }
            const randNum = Phaser.Math.Between(1,3);

            if (currentTroops + randNum > maxTroops){
                territory.data.troops += (maxTroops - currentTroops);
                currentTroops += (maxTroops - currentTroops);
            } else {
                territory.data.troops += randNum;
                currentTroops += randNum;
            }

            replaceText(territory, territory.textObj, territory.data.troops.toString());
        }
        
    }

    scene.playerGroups[scene.turn].getChildren().forEach(sprite => {
        sprite.setInteractive();
    });

    // Send updated data to the server
    const newData = {};
    for (const key in mapData){
        newData[key] = mapData[key].sprite.data;
    }

    socket.emit('setup', newData);
}

const deploy = () => {

}

const attack = () => {

}

const fortify = () => {

}