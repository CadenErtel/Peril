// --------------------------------------------    Buttons     ---------------------------------------------------------

export function buttonPress (atlas_name, button_name, currentButton) {

    currentButton.anims.create({
        key: 'button-press',
        frames: [
            { key: atlas_name , frame : `${button_name}-button-up`},
            { key: atlas_name , frame : `${button_name}-button-down`},
            { key: atlas_name , frame : `${button_name}-button-up`}
        ],
        frameRate: 45,
        repeat: 0
    });

    currentButton.anims.play("button-press");
}

// --------------------------------------------    Transitions     ---------------------------------------------------------

export function fadeOut (nextScene, currentScene, data = {}) {
    currentScene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
        console.log('Fade out complete for button:', nextScene);
        currentScene.scene.start(nextScene, { fadeIn: true, ...data });
    }, currentScene);
    
    currentScene.cameras.main.fadeOut(250);
}