import Phaser from 'phaser'

import TitleScene from './scenes/TitleScene'

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	scale: {
        mode: Phaser.Scale.ENVELOP,
        parent: 'app',
        width: '100%',
        height: '100%'
    },
	parent: 'app',
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: [TitleScene],
}

export default new Phaser.Game(config)
