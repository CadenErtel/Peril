import Phaser from 'phaser'
import TitleScene from './scenes/TitleScene'
import OptionsScene from './scenes/Options'
import GameScene from './scenes/Game'

const config = {
	type: Phaser.AUTO,
    width : 1920,
    height : 1080,
    backgroundColor : 0x00EEFA,
    resolution: window.devicePixelRatio || 1,
    physics: {
        default: 'matter',
        matter: {
            gravity : {x:0,y:0},
            // debug: {
            //     staticLineColor : 0xff0000,
            //     staticFillColor: 0xff0000,
            //     renderFill : true
            // }
        }
    },
	scale: {
        mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
    },
	scene: [TitleScene, OptionsScene, GameScene],
	parent: 'app',
    dom : {
        createContainer: true
    }
}

export default new Phaser.Game(config);
