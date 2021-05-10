// UI Elements
var hostButton = document.getElementById('hostButton');
var joinButton = document.getElementById('joinButton');
var gameIdInputField = document.getElementById('gameIdInputField');
var hostingFeedback = document.getElementById('hostingFeedback');

// EventListeners for buttons
hostButton.addEventListener('click', function() {
    socket.emit('hostGame');
    hostButton.blur();
});
joinButton.addEventListener('click', function() {
    socket.emit('joinGame', gameIdInputField.value);
    joinButton.blur();
});


// Emit events
function startDataInterval (opponentId)  {
    otherSocketId = opponentId;
    sendDataInterval = setInterval(function () {
        socket.emit('sendGameState', gameState = {
            gameGrid : Game.gameGrid,
            holdGrid : Game.holdGrid,
            nextGrid : Game.nextGrid,
            score : Game.score,
            linesCleared : Game.linesCleared,
            recipient : otherSocketId
        })
    
        if (Game.gameOver) {
            socket.emit('lostGame', otherSocketId);
            hostingFeedback.innerHTML = "Game Lost :(";
            hostingFeedback.style.color = "yellow";
            clearInterval(sendDataInterval);
        }
    }, 33);
}

// Listen for events
socket.on('receiveGameState', function(gameState){
    Game.drawPane(Game.otherGameCv, Game.otherGameCtx, gameState.gameGrid, Game.GAME_GRID_SIZE, 
        Game.GAME_GRID_WIDTH, Game.GAME_GRID_HEIGHT, Game.GAME_WIDTH, Game.GAME_HEIGHT);

    Game.drawPane(Game.otherHoldCv, Game.otherHoldCtx, gameState.holdGrid, Game.HOLD_GRID_SIZE, 
        Game.HOLD_GRID_WIDTH, Game.HOLD_GRID_HEIGHT, Game.HOLD_WIDTH, Game.HOLD_HEIGHT);

    Game.drawPane(Game.otherNextCv, Game.otherNextCtx, gameState.nextGrid, Game.NEXT_GRID_SIZE, 
        Game.NEXT_GRID_WIDTH, Game.NEXT_GRID_HEIGHT, Game.NEXT_WIDTH, Game.NEXT_HEIGHT);

    Game.updateOtherScore(gameState.score, gameState.linesCleared);
    
});

socket.on('receiveBlocks', function(lines){

    // Checking if the line y = 0 contains a block. If it does, adding a garbage line will knock out the player
    function topLineContainsBlock() {
        for (let x = 0; x < Game.GAME_GRID_WIDTH; x++) {
            if (Game.getGameGrid(x, 0) != null) {
                return true;
            }
        }
        return false;
    }


    let amount = {2 : 1, 3: 2, 4: 4}[lines];
    let openX = Math.floor(Math.random() * Game.GAME_GRID_WIDTH);
    Game.activeShape.deactivateAll();
    for (let i = 0; i < amount; i++) {
        if (topLineContainsBlock()) {
            Game.setGameOver();
        }

        // TODO: Other ways to prevent activeShape from possible collisions?
        Game.activeShape.posY -= 1;

        for (let y = 0; y < Game.GAME_GRID_HEIGHT; y++) {
            for (let x = 0; x < Game.GAME_GRID_WIDTH; x++) {
                if (y == Game.GAME_GRID_HEIGHT - 1) {
                    if (x == openX) {
                        Game.setGameGrid(x, y, null);
                    } else {
                        Game.setGameGrid(x, y, 'white');
                    }
                } else {
                    Game.setGameGrid(x, y, Game.getGameGrid(x, y + 1));
                }
            }
        }
    }
    Game.activeShape.activateAll();
});

// Server telling host that their game was successfully hosted
socket.on('hostingStarted', function(gameId){
    hostingFeedback.innerHTML = "Now hosting at " + gameId;
    hostingFeedback.style.color = "white";
});

// Server telling "joiner" that they successfully joined a game
socket.on('gameJoined', function(hostSocketId){
    if (hostSocketId != null) {
        hostingFeedback.innerHTML = "Successfully joined game";
        hostingFeedback.style.color = "white";
        startDataInterval(hostSocketId);
        Game.newGame();
    } else {
        hostingFeedback.innerHTML = "Failed to join game";
        hostingFeedback.style.color = "yellow";
    }
});

// Server telling host that a second player joined their game
socket.on('playerJoined', function(joinerSocketId){
    startDataInterval(joinerSocketId);
    Game.newGame();
});

// Server telling player that the other player just got game over/lost
socket.on('gameWon', function(){
    clearInterval(sendDataInterval);
    hostingFeedback.innerHTML = "Game Won! :D";
    hostingFeedback.style.color = "yellow";
    Game.setGameOver(); // Only to stop the winning player's game on their own client
});

// Server telling player that the other player just disconnected
socket.on('opponentDisconnected', function(){
    clearInterval(sendDataInterval);
    hostingFeedback.innerHTML = "Opponent disconnected";
    hostingFeedback.style.color = "yellow";
    Game.setGameOver();
});