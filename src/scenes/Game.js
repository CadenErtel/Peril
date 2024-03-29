import Phaser from 'phaser';
import Swal from 'sweetalert2';
import { addText, colorTransition, replaceText, shakeScreen } from '../common';

export default class GameScene extends Phaser.Scene {
    constructor() {
		super('game');
        this.myPlayer = null;
        this.inputEnabled = true;
        this.clickedTerritory = null;
        this.troopsToAdd = 0;
        this.movedTroops = false;
        this.attacked = false;
        this.hasLost = false;
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
        let colors = [];
        for (const player in this.players){
            colors.push(this.players[player].color);
        }
        
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
        const gameOverText = this.add.text(width / 2, height - 100, "You Lost!", {fontSize : "36px"}).setOrigin(.5);

        deployText.setTint(0x00FF00);
        
        this.phaseText.add(deployText);
        this.phaseText.add(attackText);
        this.phaseText.add(reinforceText);
        this.phaseText.add(waitTurnText);
        this.phaseText.add(gameOverText);

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
        
        const nextBtn = this.add.sprite(1835, 975, 'forward-button-up');
        const settingsButton = this.add.sprite(75, 75, 'options-button-up').setInteractive();

        // --------------------------------------------    Static Object Logic     --------------------------------------------------

        nextBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            // if not in the fortify stage change to next stage, else end turn
            
            if (this.stage === "deploy"){

                if (this.troopsToAdd > 0) {
                    disableInput(this);
                    Swal.fire({
                        title: `You still have ${this.troopsToAdd} troop(s) to deploy! Are you sure you want to end deployment?`,
                        showDenyButton: true,
                        confirmButtonText: 'Continue',
                        denyButtonText: 'Return',
                        icon : 'warning',
                        backdrop : false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setAttackPhase(this);
                            attack(this);
                        } 
                        enableInput(this);
                    })
                } else {
                    setAttackPhase(this);
                    attack(this);
                }

            }
            else if (this.stage === "attack"){
                if (this.attacked === false){
                    disableInput(this);
                    Swal.fire({
                        title: 'You have not attacked! Are you sure you want to skip attacking?',
                        showDenyButton: true,
                        confirmButtonText: 'Continue',
                        denyButtonText: 'Return',
                        icon : 'warning',
                        backdrop : false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setFortifyPhase(this);
                            fortify(this);
                        } 
                        enableInput(this);
                    });
                } else {
                    setFortifyPhase(this);
                    fortify(this);
                }
            }
            else if (this.stage === "fortify") {
                if (this.movedTroops === false){
                    disableInput(this);
                    Swal.fire({
                        title: 'You have not moved any troop(s)! Are you sure you want to end fortifying?',
                        showDenyButton: true,
                        confirmButtonText: 'Continue',
                        denyButtonText: 'Return',
                        icon : 'warning',
                        backdrop : false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setDeployPhase(this);
                            socket.emit('endTurn', this.myPlayer.playerNum);
                        } 
                        enableInput(this);
                    });
                } else {
                    setDeployPhase(this);
                    socket.emit('endTurn', this.myPlayer.playerNum);
                }
            }
            
        });

        settingsButton.on('pointerdown', () => {
            disableInput(this);
            this.sound.play('button-press-sound');
            Swal.fire({
                title: 'Settings',
                backdrop: false,
                showConfirmButton: true,
                showCancelButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showDenyButton: true,
                denyButtonText: "Leave Game", //reload page
                confirmButtonText: "Return to Game", //goes back to game
                cancelButtonText: "Rules"

            }).then((result) => {
                if (result.isDenied){
                    location.reload();
                }
                else if (result.isDismissed){
                    Swal.fire({
                        title: 'Rules',
                        html : `<h4> Deploy: Pick a territory and use the slider to select how many troops to add to that state. </br> </br>
                                     Attack: Select a territory that you own first, then select an adjacent territory thats owned by someone else to attack. Use the slider to deploy troops and attack.</br> </br>
                                     Fortify: Select a territory that belongs to you with more than 1 troop in it, then select another territory of yours that is contiguous to the first territory to transfer troops to. </h4>`,
                        backdrop: false,
                        showConfirmButton: true,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        confirmButtonText: "Return to Game", //goes back to game
                    }).then((result) => {
                        if (result.isConfirmed) {
                            enableInput(this);
                        }
                    })
                } else if (result.isConfirmed) {
                    enableInput(this);
                }
            });
            
        });
        
        // --------------------------------------------    Game Start     ---------------------------------------------------------

        initialLoad(this, socket);
        renderTerritories(this);
        applyListeners(this, socket);

        if (this.myPlayer.host) {
            randomizeTerritories(this, socket);
            // console.log("LETS DEPLOY!");
            nextBtn.setInteractive();
            deploy(this);
        }

        // --------------------------------------------    Socket Commands     ---------------------------------------------------------
        
        socket.on('setupTerritories', (updatedMapData) => {
            
            // console.log(updatedMapData);
            
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
            nextBtn.disableInteractive(); //diable next turn button every turn
            
            //hide phase text every turn
            this.phaseText.getChildren().forEach(sprite => {
                sprite.setVisible(false);
            })
            
            this.arrows.getChildren()[this.turn-1].setVisible(false); //hide last players arrow
            this.turn = turnNum;
            this.arrows.getChildren()[this.turn-1].setVisible(true); //show current player arrow

            //if its the current clients turn
            if (data.players[this.turn].id === this.myPlayer.id) {
                
                //if the client hasnt lost
                if (this.hasLost === false) {
                    console.log("It's Your Turn!");

                    nextBtn.setInteractive(); //if its my current turn, re-enable next turn button
                    
                    //show the turn phasing text
                    this.phaseText.getChildren().forEach((sprite, index) => {
                        if (index < 3){
                            sprite.setVisible(true);
                        }
                    });
    
                    //start deploy turn
                    deploy(this);
                } else {
                    this.phaseText.getChildren()[4].setVisible(true);
                    socket.emit('endTurn', this.myPlayer.playerNum);
                }
                
                // else its not my turn
            } else {
                //show waiting for turn text
                if (this.hasLost === false) {
                    this.phaseText.getChildren()[3].setVisible(true);
                } else {
                    this.phaseText.getChildren()[4].setVisible(true);
                }
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

        socket.on('serverAttackUpdate', (updatedMapData) => {
            // Update the values of the boxes based on the updated clientData received from the server
            shakeScreen(this, 200, 0.02);

            for (const key in updatedMapData){
                const currTerritory = this.mapData[key].sprite;
                const updatedTerritory = updatedMapData[key];
                if (currTerritory.data.owner !== updatedTerritory.owner){
                    this.playerGroups[updatedTerritory.owner].add(currTerritory);
                    this.playerGroups[currTerritory.data.owner].remove(currTerritory);
                }
                currTerritory.data.troops = updatedTerritory.troops;
                currTerritory.data.owner = updatedTerritory.owner;
                replaceText(currTerritory);
                colorTransition(this, currTerritory, currTerritory.data.color, updatedTerritory.color);
                currTerritory.data.color = updatedTerritory.color;
            }

            checkWin(this, socket);
        });

        socket.on('gameEnd', (earlyDisconnect) => {
            const message = earlyDisconnect ? "Someone Disconnected Early! The Game is now over!" : "Thanks for Playing!";
            nextBtn.disableInteractive();
            settingsButton.disableInteractive();
            disableInput(this);
            Swal.fire({
                title: message,
                text: `Hope you had fun :)`,
                backdrop: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showDenyButton: true,
                denyButtonText: "Leave Game",

            }).then((result) => {
                if (result.isDenied){
                    location.reload();
                }
            });
        });
    }
}

const initialLoad = (scene, socket) => {

    scene.arrows.getChildren()[0].setVisible(true); //initial arrow

    for (let i = 0; i < scene.numPlayers; i++){
        if (socket.id === scene.players[i+1].id){

            scene.add.text(scene.sys.game.config.width - 76, ((i * scene.sys.game.config.height) / 10) + 376, "★", {fontSize : "32px"}).setOrigin(.5);

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

const applyListeners = (scene, socket) => {

    scene.input.on('pointerdown', (pointer) => {
        // console.log("click");

        //determine if a physics body was clicked on
        const clickedBody = scene.matter.query.point(scene.matter.world.localWorld.bodies, pointer.position);

        if (scene.inputEnabled && clickedBody.length > 0) {
            const territory = clickedBody[0];
            //if the territory belongs to the player
            if (scene.myPlayer.id === scene.players[scene.turn].id){
                //if stage is deploy
                // have awindow pops up asking how many to add
                if (scene.stage === 'deploy' && territory.gameObject.data.owner === scene.turn){
                    disableInput(scene);
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
                                sendDataToServer(scene, socket, "update");
                            }

                            if (scene.troopsToAdd <= 0){
                                setAttackPhase(scene);
                                attack(scene);
                            } 
                        }
                        enableInput(scene);
                    });
                    
                } else if (scene.stage === "attack" && territory.gameObject.data.id !== scene.clickedTerritory){

                    if (scene.clickedTerritory === null){

                        if (territory.gameObject.data.owner === scene.turn){
                            scene.clickedTerritory = territory.gameObject.data.id;
                            attackPopUp(scene, territory.gameObject.data.name);
                        }

                    } else {

                        if (territory.gameObject.data.owner !== scene.turn){
                            const allowAttack = isValidAttack(scene, scene.clickedTerritory, territory.gameObject.data.id);

                            disableInput(scene);
                            if (allowAttack) {

                                const firstTerritory = scene.mapData[scene.clickedTerritory].sprite;
                                // console.log(firstTerritory);

                                Swal.fire({
                                    title: `How many troops would you like to attack ${territory.gameObject.data.name} with?`,
                                    input: 'range',
                                    inputLabel: 'Troops',
                                    backdrop: false,
                                    inputAttributes: {
                                        min: 0,
                                        max: firstTerritory.data.troops - 1,
                                        step: 1
                                    },
                                    inputValue: 0
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        const troops = Number(result.value);
                                        if (troops !== 0){
                                            console.log(`Attacked ${territory.gameObject.data.name} with ${troops} troops!`);
                                            performAttack(scene, scene.clickedTerritory, territory.gameObject, troops);
                                            scene.attacked = true;
                                            scene.clickedTerritory = null;
                                            sendDataToServer(scene, socket, "attackUpdate");
                                            checkWin(scene, socket);
                                        } else {
                                            attackPopUp(scene, scene.mapData[scene.clickedTerritory].sprite.data.name);
                                        }
                                    }
                                    enableInput(scene);
                                });

                            } else {
                                Swal.fire({
                                    title: `Can't attack ${territory.gameObject.data.name}`,
                                    backdrop: false,
                                    timer : 3000,
                                    timerProgressBar : true
                                }).then(() => {
                                    enableInput(scene);
                                    attackPopUp(scene, scene.mapData[scene.clickedTerritory].sprite.data.name);
                                });
                            }
                        }
                    }

                } else if (territory.gameObject.data.id !== scene.clickedTerritory && scene.stage === "fortify" && territory.gameObject.data.owner === scene.turn){
                    
                    if (scene.clickedTerritory !== null){

                        const allowFortify = isValidFortify(scene, scene.clickedTerritory, territory.gameObject.data.id);
                        
                        disableInput(scene);
                        if (allowFortify){
                            
                            const firstTerritory = scene.mapData[scene.clickedTerritory].sprite;
                            // console.log(firstTerritory);

                            Swal.fire({
                                title: `How many troops would you like to move to ${territory.gameObject.data.name}?`,
                                input: 'range',
                                inputLabel: 'Troops',
                                backdrop: false,
                                inputAttributes: {
                                    min: 0,
                                    max: firstTerritory.data.troops - 1,
                                    step: 1
                                },
                                inputValue: 0
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    const troops = Number(result.value);
                                    if (troops !== 0){
                                        console.log(`Moved ${troops} troops to ${territory.gameObject.data.name}!`);
                                        firstTerritory.data.troops -= troops;
                                        const currTerritory = territory.gameObject;
                                        currTerritory.data.troops += troops;
                                        replaceText(firstTerritory);
                                        replaceText(currTerritory);
                                        scene.clickedTerritory = null;
                                        scene.movedTroops = true;
                                        sendDataToServer(scene, socket, "update");
                                        setDeployPhase(scene);
                                        socket.emit('endTurn', scene.myPlayer.playerNum);
                                    } else {
                                        fortifyPopUp(scene, scene.mapData[scene.clickedTerritory].sprite.data.name);
                                    }
                                }
                                enableInput(scene);
                            });
                        } else {
                            Swal.fire({
                                title: `Can't move troops to ${territory.gameObject.data.name}`,
                                backdrop: false,
                                timer : 3000,
                                timerProgressBar : true
                            }).then(() => {
                                enableInput(scene);
                                fortifyPopUp(scene, scene.mapData[scene.clickedTerritory].sprite.data.name);
                            });
                        }


                    } else {
                        scene.clickedTerritory = territory.gameObject.data.id;
                        fortifyPopUp(scene, territory.gameObject.data.name);
                    }
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
        state.data.visited = false;
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

    sendDataToServer(scene, socket, 'setup');
}

const deploy = (scene) => {

    const troopsForTurn = getTroopsforTurn(scene);
    scene.troopsToAdd = troopsForTurn;

    disableInput(scene);
    Swal.fire({
        title: 'Deployment Phase!',
        text: `You have ${troopsForTurn} troops to deploy!`,
        backdrop: false,
        timer : 4000,
        timerProgressBar : true
    }).then(() => {
        enableInput(scene);
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
    // console.log("go to attack");
}

const setDeployPhase = (scene) => {
    const currText = scene.phaseText.getChildren();
    scene.stage = "deploy";
    // console.log("go to next turn");
    currText[2].setTint(0xFFFFFF);
    currText[0].setTint(0x00FF00);
}

const setFortifyPhase = (scene) => {
    const currText = scene.phaseText.getChildren();
    scene.stage = "fortify";
    currText[1].setTint(0xFFFFFF);
    currText[2].setTint(0x00FF00);
    // console.log("go to fortify");
}

const attack = (scene) => {

    scene.attacked = false;
    
    disableInput(scene);
    Swal.fire({
        title: 'Attack Phase!',
        text: `Choose one of your regions to attack an adjacent enemy region!`,
        backdrop: false,
        timer : 4000,
        timerProgressBar : true
    }).then(() => {
        enableInput(scene);
    });

}

const isValidAttack = (scene, start, end) => {

    const adjacentTerritories = scene.mapData[start].adjacent;
    let isValid = false;

    adjacentTerritories.forEach((territory) => {
        if (territory.data.id === end) {
            isValid = true;
        }
    })

    return isValid;
}

const performAttack = (scene, startingId, defender, troopsAttacking) => {

    const attacker = scene.mapData[startingId].sprite;
    let troopsLeft = troopsAttacking;
    let troopsDefending = defender.data.troops;
    
    while (troopsLeft !== 0 && troopsDefending !== 0){
        const attackerDice = Math.floor(Math.random() * 6) + 1; //attacker
        const defenderDice = Math.floor(Math.random() * 6) + 1; //defender

        if (attackerDice > defenderDice){
            troopsDefending--;
        } else {
            troopsLeft--;
        }
    }
    
    if (troopsDefending === 0) {
        
        //update troop count
        defender.data.troops = troopsLeft;
        replaceText(defender);

        shakeScreen(scene, 200, .02);
        
        //change color 
        colorTransition(scene, defender, defender.data.color, scene.myPlayer.color);
        defender.data.color = scene.myPlayer.color;
        
        //add and remove from corresponding groups
        scene.playerGroups[scene.turn].add(defender);
        scene.playerGroups[defender.data.owner].remove(defender);
        // console.log(scene.playerGroups[defender.data.owner]);
        defender.data.owner = scene.turn;

        // console.log(scene.playerGroups[scene.turn]);
        
    } else {
        defender.data.troops = troopsDefending;
        replaceText(defender);

        Swal.fire({
            title: `Attacked Failed!`,
            backdrop: false,
            timer : 3000,
            timerProgressBar : true
        });
    }

    attacker.data.troops -= troopsAttacking;
    replaceText(attacker);
}

const isValidFortify = (scene, start, end, visited = new Set()) => {

    if (start === end){
        return true;
    }
    
    visited.add(start);
    
    for (let i = 0; i < scene.mapData[start].adjacent.length; i++) {
        const territory = scene.mapData[start].adjacent[i];
    
        if(territory.data.owner === scene.turn && !visited.has(territory.data.id)){
            if (isValidFortify(scene, territory.data.id, end, visited)){
                return true;
            }
        }
    };
    
    return false;
}

const fortify = (scene) => {

    scene.movedTroops = false;
    
    disableInput(scene);
    Swal.fire({
        title: 'Fortify Phase!',
        text: `Move Troops from one of your regions to another that are connected!`,
        backdrop: false,
        timer : 4000,
        timerProgressBar : true
    }).then(() => {
        enableInput(scene);
    });

}

const attackPopUp = (scene, territoryName) => {

    if (scene.mapData[scene.clickedTerritory].sprite.data.troops > 1){
        Swal.fire({
            title: `Where would you like to attack from ${territoryName}?`,
            position: 'bottom-start',
            showDenyButton: true,
            denyButtonText: "Cancel",
            showConfirmButton: false,
            backdrop: false,
            willOpen: (modal) => {
                const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  
                // calculate the x and y positions for the dialog
                const x = canvasRect.right - canvasRect.width;
                const y = canvasRect.bottom - canvasRect.height;
 
                modal.style.left = x + 'px';
                modal.style.bottom = y + 'px';
            }
        }).then(() => {
            scene.clickedTerritory = null;
        });
    } else {
        disableInput(scene);
        Swal.fire({
            title: `Not enough troops in ${territoryName} to attack!`,
            backdrop: false,
            timer : 2000,
            timerProgressBar : true
        }).then(() => {
            scene.clickedTerritory = null;
            enableInput(scene);
        });
    }
}

const fortifyPopUp = (scene, territoryName) => {

    if (scene.mapData[scene.clickedTerritory].sprite.data.troops > 1){
        Swal.fire({
            title: `Where would you like to move troops from ${territoryName} to?`,
            position: 'bottom-start',
            showDenyButton: true,
            denyButtonText: "Cancel",
            showConfirmButton: false,
            backdrop: false,
            willOpen: (modal) => {
                const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  
                // calculate the x and y positions for the dialog
                const x = canvasRect.right - canvasRect.width;
                const y = canvasRect.bottom - canvasRect.height;
 
                modal.style.left = x + 'px';
                modal.style.bottom = y + 'px';
            }
        }).then(() => {
            scene.clickedTerritory = null;
        });
    } else {
        disableInput(scene);
        Swal.fire({
            title: `Not enough troops in ${territoryName} to move!`,
            backdrop: false,
            timer : 2000,
            timerProgressBar : true
        }).then(() => {
            scene.clickedTerritory = null;
            enableInput(scene);
        });
    }
}

const checkWin = (scene, socket) => {
    // console.log(scene.myPlayer);
    const numTerritories = Object.keys(scene.mapData).length;
    const numPlayers = Object.keys(scene.players).length;

    for (let i = 1; i < numPlayers + 1; i++){
        if (i === scene.myPlayer.playerNum){
            if (scene.playerGroups[i].getChildren().length === 0){

                if (scene.hasLost === false){
                    scene.hasLost = true;
                    disableInput(scene);
                    Swal.fire({
                        title: 'You Lost!',
                        text: `You can still watch until the game is over!`,
                        backdrop: false,
                        timer : 10000,
                        timerProgressBar : true
                    }).then(() => {
                        enableInput(scene);
                    });
    
                    //hide any text
                    scene.phaseText.getChildren().forEach(sprite => {
                        sprite.setVisible(false);
                    })
    
                    scene.phaseText.getChildren()[4].setVisible(true); //show you lost text
                }
            }

            if (scene.playerGroups[i].getChildren().length === numTerritories){
                disableInput(scene);
                Swal.fire({
                    title: 'You Won!',
                    text: `Congratulations!`,
                    backdrop: false,
                    timer : 10000,
                    timerProgressBar : true
                }).then(() => {
                    enableInput(scene);
                });
                socket.emit('gameOver');
            }
        }
    }
}

const disableInput = (scene) => {
    scene.inputEnabled = false;
}

const enableInput = (scene) => {
    scene.inputEnabled = true;
}

const sendDataToServer = (scene, socket, endpoint) => {
    const newData = {};
    for (const key in scene.mapData){
        newData[key] = scene.mapData[key].sprite.data;
    }
    socket.emit(endpoint, newData);
}