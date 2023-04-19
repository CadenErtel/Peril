import Phaser from 'phaser';
import {io} from "socket.io-client";
import { addText, colorTransition, replaceText, shakeScreen } from '../common';

export default class GameScene extends Phaser.Scene {
    constructor() {
		super('game');
	}

    preload () {
    }

    create(data) {
        
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        if (data.fadeIn){
            // wrap this line inside this if block
            this.cameras.main.fadeIn(500, 0, 0, 0)
        }
        
        // --------------------------------------------    Buttons     ---------------------------------------------------------

        // const button = this.add.sprite(width / 2, height / 2, 'title-atlas', 'host-button-up').setInteractive();
        // button.on('pointerdown', () => {
        //     this.scene.start('title');
        // });

        // const buttonJoin = this.add.sprite(width / 2, height / 4, 'title-atlas', 'join-button-up').setInteractive();
        // buttonJoin.on('pointerdown', () => {
        //     colorTransition(this, box1, 0xffffff, 0xff0000);
        //     colorTransition(this, box2, 0xffffff, 0x00ff00); 
        //     colorTransition(this, box3, 0xffffff, 0x0000ff); 
        //     shakeScreen(this, 200, .02);
        // });


        // --------------------------------------------    Static Objects     --------------------------------------------------

        // const box1 = this.add.sprite(width / 4, 3 * height / 4, 'menu-box').setInteractive();
        // box1.scale = .25;
        // const box1Text = addText(this, box1, '5', '64px', '#f0f');
        // box1.on('pointerdown', () => {
        //     var num = parseInt(box1Text.text);
        //     var num = num - 1;
        //     replaceText(box1, box1Text, num.toString());
        //     colorTransition(this, box1, 0xffffff, 0xff00ff);
        //     shakeScreen(this, 200, .02);
        // });

        // const box2 = this.add.sprite(2*width / 4, 3 * height / 4, 'menu-box').setInteractive();
        // box2.scale = .25;
        // const box2Text = addText(this, box2, '15', '32px', '#ff0');
        // box2Text.setColor('#f0f');

        // const box3 = this.add.sprite(3*width / 4, 3 * height / 4, 'menu-box').setInteractive();
        // box3.scale = .25;
        // const box3Text = addText(this, box3, '3', '48px', '#fff');
        // box3Text.setText('8');


        // socket creation
        const socket = io();

        // make a small grid of 20 boxes
        const boxes = [];
        for (let i = 0; i < 4; i++) {
            boxes.push([]);
            for (let j = 0; j < 5; j++) {
                boxes[i].push(this.add.sprite((j * width / 6) + 320, (i * height / 4) + 120, 'menu-box').setInteractive());
                boxes[i][j].scale = 0.25;
                let name = '{' + (j+1) + ',' + (i+1) + '}';
                var value = 0;
                const box_text = addText(this, boxes[i][j], name, '32px', '#ff0');
                const box_value = addText(this, boxes[i][j], value, '28px', '#0f0');
                box_text.setColor('#f0f');

                boxes[i][j].on('pointerdown', () => {
                    var num = parseInt(box_value.text);
                    var num = num + 1;
                    replaceText(boxes[i][j], box_value, num.toString());
                    colorTransition(this, boxes[i][j], 0xffffff, 0xff00ff);
                });
                
            }
        }
        console.log(boxes);

        // clients
        const clientData = [
            { box: '0', troops: boxes[0][0] }
        ];

        // send some data to the server
        socket.emit('clientTurnEnd', clientData);


    }
}