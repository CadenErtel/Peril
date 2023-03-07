import Phaser from 'phaser';

export default class GameStartScene extends Phaser.Scene {
    constructor() {
		super('gamestart');
	}

    preload () {
        this.load.image('button', "/ButtonBlue.png");
    }

    create(data: { fadeIn: boolean }) {
    
        if (data.fadeIn){
            // wrap this line inside this if block
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }

        const button = this.add.sprite(200, 200, 'button').setInteractive();
        button.on('pointerdown', () => {
            this.scene.start('title');
        });
    }
}