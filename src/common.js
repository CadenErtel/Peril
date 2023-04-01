// --------------------------------------------    Buttons     ---------------------------------------------------------

export function buttonPress (button_name, currentButton) {

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

export function fadeOut (nextScene, currentScene) {
    currentScene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
        console.log('Fade out complete for button:', nextScene);
        currentScene.scene.start(nextScene, { fadeIn: true });
    }, currentScene);
    
    currentScene.cameras.main.fadeOut(250);
}