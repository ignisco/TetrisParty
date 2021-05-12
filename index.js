var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
const port = process.env.PORT || 4000;
var server = app.listen(port, function(){
    console.log('listening for requests on port ' + port + ',');
});

// Static files
app.use(express.static('public'));

// Variables
var playerToGame = new Map();

function newGameId () {
    let gameId = 0;
    do {
        gameId = Math.floor(1000 + Math.random() * 9000);
    }
    while (Array.from(playerToGame.values()).find(code => code == gameId))
    return gameId;
}

function newSeed () {
    return Math.random().toString(36).substring(7);
}

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {

    console.log('made socket connection', socket.id);

    // Removing from playerToGame on disconnect
    socket.once('disconnect', function() {
        let gameId = playerToGame.get(socket.id);
        playerToGame.delete(socket.id);
        let otherSocket = Array.from(playerToGame.keys()).find(key => playerToGame.get(key) == gameId);
        if (otherSocket) {
            playerToGame.delete(otherSocket);
            io.sockets.to(otherSocket).emit('opponentDisconnected');
        }
    });

    // Host new game
    socket.on('hostGame', function(){

        // Player is already in a game/hosting
        if (playerToGame.get(socket.id)) {
            let players = Array.from(playerToGame.keys()).filter(key => playerToGame.get(key) == playerToGame.get(socket.id));
            if (players.length == 1) {
                io.sockets.to(socket.id).emit('warning', "Already hosting game");
            } else {
                io.sockets.to(socket.id).emit('warning', "Can't host while in game");
            }
            return;
        }

        let gameId = newGameId();
        playerToGame.set(socket.id, gameId);
        io.sockets.to(socket.id).emit('hostingStarted', gameId);
    });

    // Join game
    socket.on('joinGame', function(gameId){
        let count = 0;
        let hostSocketId;

        // Player is already in a game/hosting
        if (playerToGame.get(socket.id)) {
            let players = Array.from(playerToGame.keys()).filter(key => playerToGame.get(key) == playerToGame.get(socket.id));
            if (players.length == 2) {
                io.sockets.to(socket.id).emit('warning', "Can't join while in game");
                return;
            }
            // Player is hosting a game that hasn't started yet.
            // They should be able to cancel that hosting, and join this game instead
            // If the count == 1, then playerToGame.set(socket.id, gameId) will update it
            // if not, it will still continue hosting.
        }

        for (let entry of playerToGame.entries()) {

            if (entry[1] == gameId) {
                count += 1;
                hostSocketId = entry[0];
            }
        }

        if (count == 1) {
            // Easter egg when trying to join your own game
            if (socket.id == hostSocketId) {
                io.sockets.to(socket.id).emit('easteregg', hostSocketId);
                return;
            }
            playerToGame.set(socket.id, gameId);
            let seed = newSeed();
            io.sockets.to(socket.id).emit('gameJoined', data = {socketId : hostSocketId, seed : seed}); // Game successfully joined
            io.sockets.to(hostSocketId).emit('playerJoined', data = {socketId : socket.id, seed : seed}); // Telling host that a player has joined
        }
        else if (count > 1) {
            io.sockets.to(socket.id).emit('warning', "Already two players in game"); // Failed to join game; already two players
        }
        else
        {
            io.sockets.to(socket.id).emit('warning', "Couldn't find game"); // Failed to join game; not hosted
        }
    });

    // Starting Rematch
    socket.on('startRematch', function(otherPlayer){
        // Puts player back in a game, don't care about people trying to break the code (for now)
        let gameId = newGameId();
        playerToGame.set(socket.id, gameId);

        // Easter egg check
        if (otherPlayer == socket.id) {
            io.sockets.to(socket.id).emit('easteregg', socket.id);
            return;
        }

        let seed = newSeed();
        io.sockets.to(socket.id).emit('rematchGame', data = {seed : seed, message: "You started a rematch"});
        // Puts second player into the same game
        playerToGame.set(otherPlayer, gameId);
        io.sockets.to(otherPlayer).emit('rematchGame', data = {seed : seed, message: "Opponent started a rematch"});
    });

    // Send game state
    socket.on('sendGameState', function(gameState){
        io.sockets.to(gameState.recipient).emit('receiveGameState', gameState);
    });

    // Send blocks
    socket.on('sendBlocks', function(data){
        io.sockets.to(data.recipient).emit('receiveBlocks', data.lines);
    });

     // Notify other player you got game over
     socket.on('lostGame', function(otherGameId){
        playerToGame.delete(socket.id);
        playerToGame.delete(otherGameId);
        // Easter egg time
        if (socket.id == otherGameId) {
            io.sockets.to(otherGameId).emit('eastereggDraw');
        } else {
            io.sockets.to(otherGameId).emit('gameWon');
        }
    });

});
