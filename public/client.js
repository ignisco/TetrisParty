// Make connection
var socket = io.connect('192.168.10.182:4000');
var otherSocketId;
var sendDataInterval;

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



// Render gridlines on page load
// Game.renderGridlines(Game.gameCtx, Game.GAME_GRID_SIZE, Game.GAME_GRID_WIDTH, Game.GAME_GRID_HEIGHT, Game.GAME_WIDTH, Game.GAME_HEIGHT);
// Game.renderGridlines(Game.holdCtx, Game.HOLD_GRID_SIZE, Game.HOLD_GRID_WIDTH, Game.HOLD_GRID_HEIGHT, Game.HOLD_WIDTH, Game.HOLD_HEIGHT);
// Game.renderGridlines(Game.nextCtx, Game.NEXT_GRID_SIZE, Game.NEXT_GRID_WIDTH, Game.NEXT_GRID_HEIGHT, Game.NEXT_WIDTH, Game.NEXT_HEIGHT);

// Game.renderGridlines(Game.otherGameCtx, Game.GAME_GRID_SIZE, Game.GAME_GRID_WIDTH, Game.GAME_GRID_HEIGHT, Game.GAME_WIDTH, Game.GAME_HEIGHT);
// Game.renderGridlines(Game.otherHoldCtx, Game.HOLD_GRID_SIZE, Game.HOLD_GRID_WIDTH, Game.HOLD_GRID_HEIGHT, Game.HOLD_WIDTH, Game.HOLD_HEIGHT);
// Game.renderGridlines(Game.otherNextCtx, Game.NEXT_GRID_SIZE, Game.NEXT_GRID_WIDTH, Game.NEXT_GRID_HEIGHT, Game.NEXT_WIDTH, Game.NEXT_HEIGHT);

