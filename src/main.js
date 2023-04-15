import Phaser from 'phaser'
import TitleScene from './scenes/TitleScene'
import OptionsScene from './scenes/Options'
import GameScene from './scenes/Game'

const config = {
	type: Phaser.AUTO,
    width : 1920,
    height : 1080,
    resolution: window.devicePixelRatio || 1,
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
