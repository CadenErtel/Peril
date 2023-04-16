import Phaser from 'phaser';
import {fadeOut, buttonPress} from '../common';

export default class GameStartScene extends Phaser.Scene {

    constructor() {
        super('options');
	}
    
    preload () {
        this.load.image('menu-box', 'assets/images/menu-box.png');
        this.load.atlas('options-atlas', 'assets/atlas/options/buttons.png', 'assets/atlas/options/buttons.json');
        this.players = [];
        for (let i = 0; i < 4; i++){
            const player = this.add.text(1275, 235 + (i * 125), `Player ${i+1} \u2714`, {fontFamily : "blazma", fontSize : "60px"});
            player.setVisible(false);
            player.setDepth(10);
            this.players.push(player);
        }
    }
    
    create(data) {

        for (let i = 0; i < data.currPlayers; i++){
            this.players[i].setVisible(true);
        }

        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // --------------------------------------------    Socket IO    -------------------------------------------------------
        
        const socket = data.socket;

        socket.on('newPlayer', (count) => {

            console.log("New Player Joined or Left!");

            for (let i = 0; i < count; i++){
                this.players[i].setVisible(true);
            }

            for (let i = count; i < 4; i++){
                this.players[i].setVisible(false);
            }
        });

        socket.on('updateHost', (newHost) => {

            // if the clients id matches the new hosts id
            if (newHost === socket.id) {
                startBtn.setInteractive()
            } 

        });

        socket.on('startedGame', () => {
            fadeOut('game', this);
        });
        
        // --------------------------------------------    Static Objects    -------------------------------------------------------
        
        let bg = this.add.image(0, 0, 'background').setOrigin(0,0);
        bg.displayWidth = width;
        bg.displayHeight = height;

        this.add.image(width / 10, height / 2, 'menu-box').setOrigin(0,0.5);

        this.add.text(width / 2 - 190, 75, 'Room Code:', {fontFamily : "blazma", fontSize : "72px"}).setOrigin(.5,.5);
        this.add.text(width / 2 + 210, 85, `${data.roomCode}`, {fontFamily : "poppins", fontSize : "72px"}).setOrigin(.5, .5);

        this.add.text(240, height / 6, "Lobby Information", {fontFamily : "blazma", fontSize : "72px"});

        // --------------------------------------------    Buttons     ---------------------------------------------------------
        
        const backBtn = this.add.sprite(100, 75, 'options-atlas', 'back-button-up').setInteractive();
        backBtn.on('pointerdown', () => {
            if (socket) {
                socket.emit('leaveRoom');
            }
            this.sound.play('button-press-sound');
            buttonPress('options-atlas','back', backBtn);
            fadeOut('title', this);
        });

        const startBtn = this.add.sprite(1250, 725, 'options-atlas', 'start-button-up').setOrigin(0, 0);
        if (data.host) {
            startBtn.setInteractive();
        }
        startBtn.on('pointerdown', () => {
            socket.emit('startGame');
            this.sound.play('button-press-sound');
            buttonPress('options-atlas','start', startBtn);
        });

        // --------------------------------------------    Player Icons     ---------------------------------------------------------

        this.add.graphics().fillStyle(0x606266, .7).fillRoundedRect(1235, 225, 400, 75, 10);
        this.add.graphics().fillStyle(0x606266, .7).fillRoundedRect(1235, 350, 400, 75, 10);
        this.add.graphics().fillStyle(0x606266, .7).fillRoundedRect(1235, 475, 400, 75, 10);
        this.add.graphics().fillStyle(0x606266, .7).fillRoundedRect(1235, 600, 400, 75, 10);

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(300, 0, 0, 0)
        }
    }
}