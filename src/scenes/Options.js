import Phaser from 'phaser';
import Swal from 'sweetalert2';
import {fadeOut, buttonPress} from '../common';

export default class OptionsScene extends Phaser.Scene {
    
    constructor() {
        super('options');
	}
    
    preload () {
        this.load.image('menu-box', 'assets/images/menu-box.png');
        this.load.atlas('options-atlas', 'assets/atlas/options/buttons.png', 'assets/atlas/options/buttons.json');
        this.load.image('map', 'assets/images/map.png');

        this.players = [];
        this.playerData = {};

        for (let i = 0; i < 4; i++){
            const rect = this.add.graphics().fillStyle(0x606266, .7).fillRoundedRect(1235, 225 + (i*125), 400, 75, 10);
            rect.setDepth(9);
            const player = this.add.text(0, 0, `Player ${i+1}`, {fontFamily : "blazma", fontSize : "60px"});
            player.setOrigin(0.5);
            player.setPosition(1435, 225 + (i*125) + 36);
            player.setVisible(false);
            player.setDepth(10);
            this.players.push(player);
        }

    }
    
    create(data) {

        this.playerData = data.players;

        for (let i = 0; i < Object.keys(data.players).length; i++){
            // console.log(data.players[i+1].nickname);
            let nickname = data.players[i+1].nickname;
            if (i === 0){
                nickname = "♕" + nickname;
            }
            this.players[i].setText(nickname);
            this.players[i].setVisible(true);
        }

        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        // --------------------------------------------    Socket IO    -------------------------------------------------------
        
        const socket = data.socket;

        socket.on('newPlayer', (players) => {

            this.playerData = players;

            const count = Object.keys(players).length;
            console.log("New Player Joined or Left!");
            for (let i = 0; i < count; i++){
                let nickname = players[i+1].nickname;
                if (i === 0){
                    nickname = "♕" + nickname;
                }
                this.players[i].setText(nickname);
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
            fadeOut('game', this, {socket : socket, players : this.playerData});
        });
        
        // --------------------------------------------    Static Objects    -------------------------------------------------------
        
        let bg = this.add.image(0, 0, 'background').setOrigin(0,0);
        bg.displayWidth = width;
        bg.displayHeight = height;

        this.add.image(width / 10, height / 2, 'menu-box').setOrigin(0,0.5);

        this.add.image(width / 4 + 95, height / 2, 'map').setOrigin(.5).setScale(.5);
        this.add.text(width / 4 + 95, height / 2 + 275, "United States", {fontFamily : "blazma", fontSize : "64px"}).setOrigin(.5);

       this.add.text(width / 2 - 190, 75, 'Room Code:', {fontFamily : "blazma", fontSize : "72px"}).setOrigin(.5,.5);
       
       let roomCode = this.add.text(width / 2 + 210, 85, `${data.players[1].roomCode}`, {fontFamily : "poppins", fontSize : "72px"}).setOrigin(.5, .5);
       roomCode.setInteractive();
       roomCode.on('pointerdown', function () {
            navigator.clipboard.writeText(roomCode.text);
            startBtn.disableInteractive();
            Swal.fire({
                title: 'Copied Room Code!',
                backdrop: false,
                showConfirmButton: true,
                allowEscapeKey: true,
                confirmButtonText: "Ok",
                timer : 1000,
                timerProgressBar : true
            }).then(() => {
                startBtn.setInteractive();
            });
       }); 

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
            this.sound.play('button-press-sound');
            buttonPress('options-atlas','start', startBtn);
            if (Object.keys(this.playerData).length > 1) {
                socket.emit('startGame');
            } else {
                startBtn.disableInteractive();
                Swal.fire({
                    title: 'Not Enough Players!',
                    icon : 'error',
                    backdrop: false,
                    showConfirmButton: true,
                    allowEscapeKey: false,
                    confirmButtonText: "Ok"
                }).then(() => {
                    startBtn.setInteractive();
                });
            }
        });

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(300, 0, 0, 0)
        }
    }
}