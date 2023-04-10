import Phaser from 'phaser';
import { colorTransition } from '../common';

export default class GameStartScene extends Phaser.Scene {
    constructor() {
		super('gamestart');
	}

    preload () {
        this.load.atlas('atlas', 'assets/atlas/title/buttons.png', 'assets/atlas/title/buttons.json');
    }

    create(data) {
        
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        if (data.fadeIn){
            // wrap this line inside this if block
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }
        
        const button = this.add.sprite(width / 2, height / 2, 'atlas', 'host-button-up').setInteractive();
        button.on('pointerdown', () => {
            this.scene.start('title');
        });

        const buttonJoin = this.add.sprite(width / 2, height / 4, 'atlas', 'join-button-up').setInteractive();
        const box1 = this.add.sprite(width / 4, 3 * height / 4, 'menu-box').setInteractive();
        box1.scale = .25;
        const box2 = this.add.sprite(2*width / 4, 3 * height / 4, 'menu-box').setInteractive();
        box2.scale = .25;
        const box3 = this.add.sprite(3*width / 4, 3 * height / 4, 'menu-box').setInteractive();
        box3.scale = .25;

        buttonJoin.on('pointerdown', () => {
            colorTransition(this, box1, 0xffffff, 0x00ff00);
            colorTransition(this, box2, 0xffffff, 0x00ff00); 
            colorTransition(this, box3, 0xffffff, 0x00ff00); 

        });
    }
}