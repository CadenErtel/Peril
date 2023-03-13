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

        this.load.image('button-up', "/images/host-button-up.png");
        this.load.image('button-down', "/images/host-button-down.png");
        this.load.audio('button-press-sound', '/audio/button-press.mp3');

    }

    create() {

        const button_press_sound = this.sound.add('button-press-sound');

        for (let i = 0; i < 4; i++){
            let image = this.add.image(0, 0,`bg${i+1}`).setOrigin(0,0);
            image.displayWidth = this.sys.canvas.width;
            image.displayHeight = this.sys.canvas.height;
        }
        
        this.add.image(window.innerWidth / 2, window.innerHeight / 6, 'title').scale = 1.5;
        
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

        const input = this.add.dom(2 * window.innerWidth / 3, 2 * window.innerHeight / 5, 'input');
        input.node.setAttribute('id', 'join-game-field');
        
        input.addListener('keydown');
        // When the user presses "Enter", log the text to the console
        input.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                console.log((input.node as HTMLInputElement).value);
                (input.node as HTMLInputElement).value = '';
            }
        });
        
        const button1 = this.add.sprite(window.innerWidth / 3, window.innerHeight / 2, 'button-up').setInteractive();
        
        button1.on('pointerdown', () => {
            button1.anims.play("button-press");
            button_press_sound.play();
            fadeOut('gamestart', this);
        });

        const button2 = this.add.sprite(2 * window.innerWidth / 3, window.innerHeight / 2, 'button-up').setInteractive();
        button2.on('pointerdown', () => {
            button2.anims.play("button-press");
            button_press_sound.play();
            fadeOut('gamestart', this);
        });

        const fadeOut = (nextScene : string, currentScene : Phaser.Scene) => {
            currentScene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
                console.log('Fade out complete for button:', nextScene);
                currentScene.scene.start(nextScene, { fadeIn: true });
            });
        
            currentScene.cameras.main.fadeOut(250);
        }

        
    }
}