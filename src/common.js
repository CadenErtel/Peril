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

export function colorTransition (scene, sprite, startColor, endColor) {
    
    const startColorValue = Phaser.Display.Color.ValueToColor(startColor);
    const endColorValue = Phaser.Display.Color.ValueToColor(endColor);
    
    scene.tweens.addCounter({
        from: 0,
        to: 100,
        targets: sprite,
        duration: 1000,
        ease: Phaser.Math.Easing.Sine.InOut,
        onUpdate: transition => {
            const value = transition.getValue()
            const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(startColorValue, endColorValue, 100, value)
            const color = Phaser.Display.Color.GetColor(colorObject.r, colorObject.g, colorObject.b);
            sprite.setTint(color);
        }
    });
}

export function shakeScreen (scene, duration, intensity) {
    scene.cameras.main.shake(duration, intensity);
}

// --------------------------------------------    Text Functions     ---------------------------------------------------------

export function addText (scene, sprite, text, size, color) {
    const word = scene.add.text(0, 0, text, { fontSize: size, fill: color });
    word.setPosition(sprite.x - word.width / 2, sprite.y - word.height /2);
    return word;
}

export function replaceText(sprite, textObject, text) {
    textObject.setText(text);
    textObject.setPosition(sprite.x - textObject.width / 2, sprite.y - textObject.height /2);
}