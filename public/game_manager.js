Game.init();

document.addEventListener('keydown', (e) => {

    let key = e.code;
    console.log(e.code)
    if (Game.alternativeKeysContainsKey(key)) {
        key = Game.getAlternativeKeys(key);
    }
    if (Game.keyIsUsedInGame(key)) {
        if (Game.getActiveKeys(key) == null) {
            Game.setActiveKeys(key, window.performance.now());
            Game.addFirstPressKey(key);
        }
    }

    // Preventing Space and Arrow keys from triggering page scrolling
    if([KeyCode.SPACE, KeyCode.UP, KeyCode.DOWN].includes(e.code) && e.target == document.body) {
        e.preventDefault();
      }
});

document.addEventListener('keyup', (e) => {
    
    let key = e.code;
    if (Game.alternativeKeysContainsKey(key)) {
        key = Game.getAlternativeKeys(key);
    }
    if (Game.keyIsUsedInGame(key)) {
        Game.setActiveKeys(key, null);
    }
});

Game.newGame();