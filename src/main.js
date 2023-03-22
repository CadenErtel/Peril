import Phaser from 'phaser'
import TitleScene from './scenes/TitleScene'
import GameStartScene from './scenes/GameStart'
import OptionsScene from './scenes/Options'

const config = {
	type: Phaser.AUTO,
	scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'app',
        width: '100%',
        height: '100%'
    },
	parent: 'app',
	scene: [TitleScene, GameStartScene, OptionsScene],
    dom : {
        createContainer: true
    }
}

export default new Phaser.Game(config);
