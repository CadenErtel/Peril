import Phaser from 'phaser';

export default class GameStartScene extends Phaser.Scene {
    constructor() {
		super('options');
	}

    preload () {
        this.load.image('button', "/blue-button-up.png");
    }

    create() {
        const button = this.add.sprite(200, 200, 'button').setInteractive();
        button.on('pointerdown', () => {
            this.scene.start('title');
        });
    }
}