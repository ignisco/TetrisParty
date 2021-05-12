// UI Elements
var hostButton = document.getElementById('hostButton');
var joinButton = document.getElementById('joinButton');
var gameIdInputField = document.getElementById('gameIdInputField');
var connectionFeedback = document.getElementById('connectionFeedback');
var connectionWarning = document.getElementById('connectionWarning');

// EventListeners for buttons
hostButton.addEventListener('click', function() {
    socket.emit('hostGame');
    hostButton.blur();
});
joinButton.addEventListener('click', function() {
    socket.emit('joinGame', gameIdInputField.value);
    joinButton.blur();
});

// connectionWarning timer
function warningFadeout() {
    setTimeout(function() {
        connectionWarning.innerHTML = "";
    }, 1000);
}


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
            connectionFeedback.innerHTML = "Game Lost :(";
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
    connectionWarning.innerHTML = "";
    connectionFeedback.innerHTML = "Now hosting at " + gameId;
});

// Server telling "joiner" they successfully joined a game
socket.on('gameJoined', function(data){
    Math.seedrandom(data.seed);
    connectionWarning.innerHTML = "";
    connectionFeedback.innerHTML = "Successfully joined game";
    startDataInterval(data.socketId);
    Game.newGame();
});

// Server telling host that a second player joined their game
socket.on('playerJoined', function(data){
    Math.seedrandom(data.seed);
    connectionFeedback.innerHTML = "Someone joined your game";
    startDataInterval(data.socketId);
    Game.newGame();
});

// Server giving warnings when trying to join/host while already in-game etc.
socket.on('warning', function(message){
    connectionWarning.innerHTML = message;
    warningFadeout();
});

// Server telling player that the other player just got game over/lost
socket.on('gameWon', function(){
    clearInterval(sendDataInterval);
    connectionFeedback.innerHTML = "Game Won! :D";
    Game.setGameOver(); // Only to stop the winning player's game on their own client
});

// Server telling player that the other player just disconnected
socket.on('opponentDisconnected', function(){
    clearInterval(sendDataInterval);
    connectionWarning.innerHTML = "Opponent disconnected";
    connectionFeedback.innerHTML = "Currently not in game";
    Game.setGameOver();
});

// Easteregg when player tries to host and then join their own game
socket.on('easteregg', function(yourOwnId){
    clearInterval(sendDataInterval); // In case you press join multiple times on your own game
    connectionFeedback.innerHTML = "500 IQ BRO XD";
    startDataInterval(yourOwnId);
    Game.newGame();
});

// When you play against yourself, the only result is a draw xD
socket.on('eastereggDraw', function(){
    connectionFeedback.innerHTML = "Wow, a draw! That was a really close match, maybe you'll beat yourself next time ;)";
});