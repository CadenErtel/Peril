import Phaser from 'phaser';

export default class GameStartScene extends Phaser.Scene {
    constructor() {
		super('gamestart');
	}

    preload () {
        this.load.atlas('atlas', 'assets/atlas/title/buttons.png', 'assets/atlas/title/buttons.json');
    }

    create(data) {
    
        if (data.fadeIn){
            // wrap this line inside this if block
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }
        
        const button = this.add.sprite(window.innerWidth / 2, window.innerHeight / 2, 'atlas', 'host-button-up').setInteractive();
        button.on('pointerdown', () => {
            this.scene.start('title');
        });
    }
}