import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
		super('title');
	}

    preload () {
        this.load.image('title', "/title.png");
        this.load.image('bg1', "/title_bg_1.png");
        this.load.image('bg2', "/title_bg_2.png");
        this.load.image('bg3', "/title_bg_3.png");
        this.load.image('bg4', "/title_bg_4.png");
        this.load.image('button', "/ButtonBlue.png");
    }

    create() {

        for (let i = 0; i < 4; i++){
            let image = this.add.image(0, 0,`bg${i+1}`).setOrigin(0,0);
            image.displayWidth = this.sys.canvas.width;
            image.displayHeight = this.sys.canvas.height;
        }
        
        this.add.image(50, 25, 'title').setOrigin(0);

        const button1 = this.add.sprite(180, 225, 'button').setInteractive();
        button1.on('pointerdown', () => {
            this.scene.start('gamestart');
        });

        const button2 = this.add.sprite(180, 300, 'button').setInteractive();
        button2.on('pointerdown', () => {
            this.scene.start('options');
        });

    }
}