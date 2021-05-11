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
            io.sockets.to(otherSocket).emit('opponentDisconnected');
        }
    });

    // Host new game
    socket.on('hostGame', function(){

        if (playerToGame.get(socket.id)) {
            let players = Array.from(playerToGame.keys()).filter(key => playerToGame.get(key) == playerToGame.get(socket.id));
            if (players.length == 1) {
                io.sockets.to(socket.id).emit('warning', "Already hosting game");
            } else {
                io.sockets.to(socket.id).emit('warning', "Can't host while in-game");
            }
            return;
        }

        let gameId = 1000;
        do {
            gameId = Math.floor(1000 + Math.random() * 9000);
        }
        while (Array.from(playerToGame.values()).find(code => code == gameId))
        playerToGame.set(socket.id, gameId);
        io.sockets.to(socket.id).emit('hostingStarted', gameId);
    });

    // Join game
    socket.on('joinGame', function(gameId){
        let count = 0;
        let hostSocketId;
        for (let entry of playerToGame.entries()) {

            if (entry[0] == socket.id) { // Player has already joined a game
                io.sockets.to(socket.id).emit('warning', "Can't join while hosting/in-game"); // Not allowed to join two games at once
                return;
            }

            if (entry[1] == gameId) {
                count += 1;
                hostSocketId = entry[0];
            }
        }

        if (count == 1) {
            playerToGame.set(socket.id, gameId);
            io.sockets.to(socket.id).emit('gameJoined', hostSocketId); // Game successfully joined
            io.sockets.to(hostSocketId).emit('playerJoined', socket.id); // Telling host that a player has joined
            return;
        }
        else if (count > 1) {
            io.sockets.to(socket.id).emit('warning', "Already two players in game"); // Failed to join game; already two players
        }
        else
        {
            io.sockets.to(socket.id).emit('warning', "Couldn't find game"); // Failed to join game; not hosted
        }
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
        io.sockets.to(otherGameId).emit('gameWon');
    });

});
