import Phaser from 'phaser';
import { fadeOut, buttonPress} from '../common';

export default class GameStartScene extends Phaser.Scene {
    constructor() {
		super('options');
	}

    preload () {
        this.load.image('background', 'assets/images/title_bg.png');
        this.load.image('menu-box', 'assets/images/menu-box.png');
        this.load.atlas('atlas', 'assets/atlas/title/buttons.png', 'assets/atlas/title/buttons.json');

        this.load.audio('button-press-sound', 'assets/audio/button-press.mp3');
    }

    create(data) {

        
        // --------------------------------------------    Static Images    -------------------------------------------------------
        
        let bg = this.add.image(0, 0, 'background').setOrigin(0,0);
        bg.displayWidth = window.innerWidth;
        bg.displayHeight = window.innerHeight;

        let image = this.add.image(window.innerWidth / 3, window.innerHeight / 12, 'menu-box').setOrigin(0,0);

        // --------------------------------------------    Buttons     ---------------------------------------------------------
        
        const backBtn = this.add.sprite(window.innerWidth / 7, window.innerHeight / 17, 'atlas', 'host-button-up').setInteractive();
        backBtn.on('pointerdown', () => {
            this.sound.play('button-press-sound');
            buttonPress('host', backBtn);
            fadeOut('title', this);
        });
        
        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        if (data.fadeIn){
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }
    }
}