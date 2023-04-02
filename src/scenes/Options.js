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

        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        console.log(width, height);
        
        // --------------------------------------------    Static Images    -------------------------------------------------------
        
        let bg = this.add.image(0, 0, 'background').setOrigin(0,0);
        bg.displayWidth = width;
        bg.displayHeight = height;

        let image = this.add.image(width / 3, height / 12, 'menu-box').setOrigin(0,0);

        // --------------------------------------------    Buttons     ---------------------------------------------------------
        
        const backBtn = this.add.sprite(width / 7, height / 17, 'atlas', 'host-button-up').setInteractive();
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