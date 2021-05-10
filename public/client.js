// Make connection
var socket = io.connect('http://localhost:4000');
var otherSocketId;

// UI Elements
var hostButton = document.getElementById('hostButton');
var joinButton = document.getElementById('joinButton');
var gameIdInputField = document.getElementById('gameIdInputField');
var hostingFeedback = document.getElementById('hostingFeedback');

// EventListeners for buttons
hostButton.addEventListener('click', function() {
    socket.emit('hostGame');
});
joinButton.addEventListener('click', function() {
    socket.emit('joinGame', gameIdInputField.value);
});


// Emit events
var sendDataInterval = setInterval(function () {
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
    console.log(hostSocketId)
    if (hostSocketId != null) {
        hostingFeedback.innerHTML = "Successfully joined game";
        hostingFeedback.style.color = "white";
        otherSocketId = hostSocketId;
        Game.newGame();
    } else {
        hostingFeedback.innerHTML = "Failed to join game";
        hostingFeedback.style.color = "yellow";
    }
});

// Server telling host that a second player joined their game
socket.on('playerJoined', function(joinerSocketId){
    otherSocketId = joinerSocketId;
    Game.newGame();
});

// Server telling player that the other player just got game over/lost
socket.on('gameWon', function(){
    clearInterval(sendDataInterval);
    hostingFeedback.innerHTML = "Game Won! :D";
    hostingFeedback.style.color = "yellow";
    Game.setGameOver(); // Only to stop the winning player's game on their own client
});
