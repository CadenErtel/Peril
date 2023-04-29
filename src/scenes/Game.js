import Phaser from 'phaser';
import Swal from 'sweetalert2';
import { addText, colorTransition, replaceText, shakeScreen } from '../common';

export default class GameScene extends Phaser.Scene {
    constructor() {
		super('game');
        this.myPlayer = null;
        this.troopsToAdd = 0;
        this.mapData = {};
	}
    
    preload () {
        this.load.image('forward-button-up', 'assets/images/forward-button-up.png');
        this.load.image('forward-button-down', 'assets/images/forward-button-down.png');
        this.load.image('options-button-up', 'assets/images/options-button-up.png');
        this.load.image('options-button-down', 'assets/images/options-button-down.png');
        
        this.load.atlas('state-atlas', 'assets/states/stateIcons.png', 'assets/states/stateIcons.json');
        this.load.json('state-bodies', 'assets/states/states.json');
        this.load.json('state-data', 'assets/states/stateData.json');
        
        this.turn = 1;
        this.stage = "deploy";
        this.playerGroups = {};
        
        this.players = this.scene.settings.data.players;
        this.numPlayers = Object.keys(this.scene.settings.data.players).length;
        
        this.arrows = this.add.group();
        // for each player make a sprite on the side
        // make an arrow that can move to each sprite
        const colors = [0xad1a18, 0x051f75, 0xe9f032, 0x18871c];
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
            this.cameras.main.fadeIn(500, 0, 0, 0);
            this.cameras.main.setBackgroundColor('#2694b5');
        }

        // --------------------------------------------    Static Objects     --------------------------------------------------
        
        const nextBtn = this.add.sprite(1835, 975, 'forward-button-up').setInteractive();
        const settingsButton = this.add.sprite(75, 75, 'options-button-up').setInteractive();

        // --------------------------------------------    Static Object Logic     --------------------------------------------------

        nextBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            // if not in the fortify stage change to next stage, else end turn
            
            if (this.stage === "deploy"){

                if (this.troopsToAdd > 0) {
                    disablePlayerSprites(this);
                    Swal.fire({
                        title: 'You still have troops to deploy! Are you sure you want to end deployment?',
                        showDenyButton: true,
                        confirmButtonText: 'Continue',
                        denyButtonText: 'Return',
                        icon : 'warning',
                        backdrop : false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setAttackPhase(this);
                        } 
                        enablePlayerSprites(this);
                    })
                } else {
                    setAttackPhase(this);
                }

            }
            else if (this.stage === "attack"){
                attack();
                setFortifyPhase(this);
            }
            else if (this.stage === "fortify") {
                fortify();
                setDeployPhase(this);
                socket.emit('endTurn');
            }
            
        });

        
        settingsButton.on('pointerdown', () => {
            this.sound.play('button-press-sound');
        });
        
        // --------------------------------------------    Game Start     ---------------------------------------------------------

        initialLoad(this, socket);
        
        renderTerritories(this);
        if (this.myPlayer.host) {
            randomizeTerritories(this, socket);
        }
        
        applyListeners(this);

        if (this.myPlayer.host) {
            console.log("LETS DEPLOY!");
            deploy(this);
        }

        // --------------------------------------------    Socket Commands     ---------------------------------------------------------
        
        socket.on('setupTerritories', (updatedMapData) => {
            
            console.log(updatedMapData);
            
            for (let i = 0; i < this.numPlayers; i++){
                this.playerGroups[i+1] = this.add.group();
            }
            
            for (const key in updatedMapData){
                const currTerritory = this.mapData[key].sprite;
                const updatedTerritory = updatedMapData[key];
                currTerritory.data.troops = updatedTerritory.troops;
                currTerritory.data.owner = updatedTerritory.owner;
                replaceText(currTerritory);
                colorTransition(this, currTerritory, currTerritory.data.color, updatedTerritory.color);
                currTerritory.data.color = updatedTerritory.color;
                this.playerGroups[updatedTerritory.owner].add(currTerritory);
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
                enablePlayerSprites(this);
                
                //show the turn phasing text
                this.phaseText.getChildren().forEach((sprite, index) => {
                    if (index < 3){
                        sprite.setVisible(true);
                    }
                });

                //start deploy turn
                deploy(this);

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
                const currTerritory = this.mapData[key].sprite;
                const updatedTerritory = updatedMapData[key];
                currTerritory.data.troops = updatedTerritory.troops;
                currTerritory.data.owner = updatedTerritory.owner;
                replaceText(currTerritory);
                colorTransition(this, currTerritory, currTerritory.data.color, updatedTerritory.color);
                currTerritory.data.color = updatedTerritory.color;
            }
        });
    }
}

//TODO convert from squares to states 

const initialLoad = (scene, socket) => {

    scene.arrows.getChildren()[0].setVisible(true); //initial arrow

    for (let i = 0; i < scene.numPlayers; i++){
        if (socket.id === scene.players[i+1].id){
            scene.myPlayer = scene.players[i+1];
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

    scene.input.on('pointerdown', (pointer) => {
        //determine if a physics body was clicked on
        const clickedBody = scene.matter.query.point(scene.matter.world.localWorld.bodies, pointer.position);

        if (clickedBody.length > 0) {
            const territory = clickedBody[0];
            //if the territory belongs to the player
            if (scene.myPlayer.id === scene.players[scene.turn].id && territory.gameObject.data.owner === scene.turn){
                //if stage is deploy
                // have awindow pops up asking how many to add
                if (scene.stage === 'deploy'){
                    disablePlayerSprites(scene);
                    Swal.fire({
                        title: `How many troops would you like to deploy to ${territory.gameObject.data.name}?`,
                        input: 'range',
                        inputLabel: 'Troops',
                        backdrop: false,
                        inputAttributes: {
                            min: 0,
                            max: scene.troopsToAdd,
                            step: 1
                        },
                        inputValue: 0
                    }).then((result) => {
                        if (result.isConfirmed) {
                            const troops = Number(result.value);
                            if (troops !== 0){
                                console.log(`Deployed ${troops} troops!`);
                                scene.troopsToAdd -= troops;
                                const currTerritory = territory.gameObject;
                                currTerritory.data.troops += troops;
                                replaceText(currTerritory);
                            }

                            if (scene.troopsToAdd === 0){
                                setAttackPhase(scene);
                            } 
                        }
                        enablePlayerSprites(scene);
                    });
                    
                } else if (scene.stage === "attack"){
                    // colorTransition(scene, box, box.data.color, scene.myPlayer.color);
                    // box.data.color = scene.myPlayer.color;
                    // box.data.owner = scene.myPlayer.id;
                }
            }
        }	            
    });
}

const renderTerritories = (scene) => {

    const stateData = scene.cache.json.get('state-data');
    const stateBodies = scene.cache.json.get('state-bodies');

    for (const key in stateData) {

        const x = stateData[key][1];
        const y = stateData[key][2];

        const state = scene.matter.add.sprite(x, y, 'state-atlas', key);
        
        let offsetX = 0;
        let offsetY = 0;
        
        if (stateData[key][5]){
            offsetX = stateData[key][5][0];
            offsetY = stateData[key][5][1];
        }

        const state_body = scene.matter.add.fromPhysicsEditor(x + 140 + offsetX, y - 220 + offsetY, stateBodies[key]);
        state.setExistingBody(state_body);
        state.setScale(stateData[key][3]);
        
        const text_value = addText(scene, state, 1, '28px', '#0f0');
        if (stateData[key][6]){
            let textOffsetX = stateData[key][6][0];
            let textOffsetY = stateData[key][6][1];
            text_value.x = text_value.x + textOffsetX;
            text_value.y = text_value.y + textOffsetY; 
            text_value.offsetX = textOffsetX;
            text_value.offsetY = textOffsetY;
        }
        
        state.data = {};
        state.data.id = key;
        state.data.name = stateData[key][0];
        state.data.owner = null;
        state.data.color = 0xffffff;
        state.data.troops = 1;
        state.textObj = text_value; 

        scene.mapData[key] = 
        {
            sprite : state,
            adjacent : stateData[key][4]
        }
        
    }

    for (const key in scene.mapData){
        scene.mapData[key].adjacent.forEach((state, index) => {
            scene.mapData[key].adjacent[index] = scene.mapData[state].sprite;
        });
    }
}

const randomizeTerritories = (scene, socket) => {
    const numTerritories = Object.keys(scene.mapData).length;
    const numPlayers = Object.keys(scene.players).length;

    for (let i = 1; i < numPlayers + 1; i++){
        scene.playerGroups[i] = scene.add.group();
    }

    //for each territory equally distributed
    for (let i = 0; i < numTerritories / numPlayers; i++){
        //for each player
        for (let playerId = 1; playerId < numPlayers + 1; playerId++){

            //choose a random territory
            const territories = Object.keys(scene.mapData);
            let territory = territories[Math.floor(Math.random() * numTerritories)];

            //grab its sprite
            let currTerritory = scene.mapData[territory].sprite;

            //find one that isnt already owned
            while (currTerritory.data.owner != null) {
                territory = territories[Math.floor(Math.random() * numTerritories)];
                currTerritory = scene.mapData[territory].sprite;
            }

            //claim it and assign it to player group
            currTerritory.data.owner = playerId;
            colorTransition(scene, currTerritory, currTerritory.data.color, scene.players[playerId].color);
            currTerritory.data.color =  scene.players[playerId].color;
            scene.playerGroups[playerId].add(currTerritory);
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

            replaceText(territory);
        }
        
    }

    scene.playerGroups[scene.turn].getChildren().forEach(sprite => {
        sprite.setInteractive();
    });

    // Send updated data to the server
    const newData = {};
    for (const key in scene.mapData){
        newData[key] = scene.mapData[key].sprite.data;
    }

    socket.emit('setup', newData);
}

const deploy = (scene) => {

    const troopsForTurn = getTroopsforTurn(scene);
    scene.troopsToAdd = troopsForTurn;

    disablePlayerSprites(scene);
    Swal.fire({
        title: 'Deployment Phase!',
        text: `You have ${troopsForTurn} troops to deploy!`,
        backdrop: false,
        timer : 4000,
        timerProgressBar : true
    }).then(() => {
        enablePlayerSprites(scene);
    });

}

const getTroopsforTurn = (scene) => {

    const numTerritories = Object.keys(scene.mapData).length;
    const baseCount = Math.floor(numTerritories / (2 * scene.numPlayers));
    let bonus = 0;

    const myTerritoriesCount = scene.playerGroups[scene.turn].getChildren().length;
    if (myTerritoriesCount > (numTerritories / scene.numPlayers)){
        const diff = myTerritoriesCount - (numTerritories / scene.numPlayers);
        bonus += Math.floor(diff / 2);
    }

    return baseCount + bonus;
}

const setAttackPhase = (scene) => {
    const currText = scene.phaseText.getChildren();
    scene.troopsToAdd = 0;
    scene.stage = "attack";
    currText[0].setTint(0xFFFFFF);
    currText[1].setTint(0x00FF00);
    console.log("go to attack");
}

const setDeployPhase = (scene) => {
    const currText = scene.phaseText.getChildren();
    scene.stage = "deploy";
    console.log("go to next turn");
    currText[2].setTint(0xFFFFFF);
    currText[0].setTint(0x00FF00);
}

const setFortifyPhase = (scene) => {
    const currText = scene.phaseText.getChildren();
    scene.stage = "fortify";
    currText[1].setTint(0xFFFFFF);
    currText[2].setTint(0x00FF00);
    console.log("go to fortify");
}

const attack = () => {

}

const fortify = () => {

}

const disablePlayerSprites = (scene) => {
    scene.playerGroups[scene.turn].getChildren().forEach(sprite => {
        sprite.disableInteractive();
    });
}

const enablePlayerSprites = (scene) => {
    scene.playerGroups[scene.turn].getChildren().forEach(sprite => {
        sprite.setInteractive();
    });
}