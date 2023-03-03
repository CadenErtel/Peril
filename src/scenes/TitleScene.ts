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
    }

    create() {

        for (let i = 0; i < 4; i++){
            let image = this.add.image(0, 0,`bg${i+1}`).setOrigin(0);
            image.displayWidth = this.sys.canvas.width;
            image.displayHeight = this.sys.canvas.height;
        }
        
        this.add.image(50, 25, 'title').setOrigin(0);

    }
}