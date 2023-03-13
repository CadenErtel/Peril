import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
		super('title');
	}

    preload () {
        this.load.image('title', "/images/title.png");
        this.load.image('background', '/images/title_bg.png');

        this.load.atlas('atlas', '/atlas/title/buttons.png', '/atlas/title/buttons.json');
        this.load.audio('button-press-sound', '/audio/button-press.mp3');

    }

    create() {

        // --------------------------------------------    Static Images    -------------------------------------------------------

        let image = this.add.image(0, 0, 'background').setOrigin(0,0);
        image.displayWidth = window.innerWidth;
        image.displayHeight = window.innerHeight;
        
        this.add.image(window.innerWidth / 2, window.innerHeight / 6, 'title').scale = 1.5;

        // --------------------------------------------    Text Field     ---------------------------------------------------------
        
        const input = this.add.dom(3 * window.innerWidth / 5, 11 * window.innerHeight / 21 - 15, 'input').setInteractive();
        input.node.setAttribute('id', 'join-game-field');
        (input.node as HTMLInputElement).value = 'Enter Code'

        input.addListener('pointerdown');
        input.on('pointerdown', () => {
            if ((input.node as HTMLInputElement).value === 'Enter Code') {
                (input.node as HTMLInputElement).value = '';
            }
        });
        
        input.addListener('keydown');
        // When the user presses "Enter", log the text to the console
        input.on('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                console.log((input.node as HTMLInputElement).value);
                (input.node as HTMLInputElement).value = '';
            }
        });

        // --------------------------------------------    Buttons     ---------------------------------------------------------

        const button_press_sound = this.sound.add('button-press-sound');
        
        const button1 = this.add.sprite(window.innerWidth / 3, window.innerHeight / 2, 'atlas', 'host-button-up').setInteractive();
        button1.on('pointerdown', () => {
            button_press_sound.play();
            buttonPress('host', button1);
            fadeOut('gamestart', this);
        });
        
        const button2 = this.add.sprite(2 * window.innerWidth / 3, 3 * window.innerHeight / 7 + 15, 'atlas', 'join-button-up').setInteractive();
        button2.on('pointerdown', () => {
            button2.anims.play("button-press");
            buttonPress('join', button2);
            fadeOut('gamestart', this);
        });
        
        const buttonPress = (button_name : string, currentButton : Phaser.GameObjects.Sprite) => {

            currentButton.anims.create({
                key: 'button-press',
                frames: [
                    { key: 'atlas' , frame : `${button_name}-button-up`},
                    { key: 'atlas' , frame : `${button_name}-button-down`},
                    { key: 'atlas' , frame : `${button_name}-button-up`}
                ],
                frameRate: 45,
                repeat: 0
            });

            currentButton.anims.play("button-press");

        }

        // --------------------------------------------    Transitions     ---------------------------------------------------------
        
        const fadeOut = (nextScene : string, currentScene : Phaser.Scene) => {
            currentScene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
                console.log('Fade out complete for button:', nextScene);
                currentScene.scene.start(nextScene, { fadeIn: true });
            }, currentScene);
            
            currentScene.cameras.main.fadeOut(250);
        }
        
        
    }
}