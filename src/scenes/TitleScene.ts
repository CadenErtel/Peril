import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
		super('title');
	}

    preload () {
        this.load.image('title', "/images/title.png");
        this.load.image('bg1', "/images/title_bg_1.png");
        this.load.image('bg2', "/images/title_bg_2.png");
        this.load.image('bg3', "/images/title_bg_3.png");
        this.load.image('bg4', "/images/title_bg_4.png");

        this.load.image('button-up', "/images/blue-button-up.png");
        this.load.image('button-down', "/images/blue-button-down.png");
        this.load.audio('button-press-sound', '/audio/button-press.mp3');

    }

    create() {

        const button_press_sound = this.sound.add('button-press-sound');

        for (let i = 0; i < 4; i++){
            let image = this.add.image(0, 0,`bg${i+1}`).setOrigin(0,0);
            image.displayWidth = this.sys.canvas.width;
            image.displayHeight = this.sys.canvas.height;
        }
        
        this.add.image(50, 25, 'title').setOrigin(0);
        
        // Define the "button-anim" animation with the "button-up" and "button-down" frames
        this.anims.create({
            key: 'button-press',
            frames: [
                { key: 'button-up' },
                { key: 'button-down' },
                { key: 'button-up'}
            ],
            frameRate: 45,
            repeat: 0
        });
        
        const button1 = this.add.sprite(250, 225, 'button-up').setInteractive();
        
        button1.on('pointerdown', () => {
            button1.anims.play("button-press");
            button_press_sound.play();
            this.cameras.main.fadeOut(250, 0, 0, 0);
        });
        
        const button2 = this.add.sprite(250, 325, 'button-up').setInteractive();
        button2.on('pointerdown', () => {
            this.scene.start('options');
        });

        this.add.text(175, 205, "Play Game", { fontFamily: 'Baskerville', fontSize: 32, color: '0' });
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('gamestart', { fadeIn: true })
        })
        
    }
}