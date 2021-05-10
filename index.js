var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
var server = app.listen(4000, function(){
    console.log('listening for requests on port 4000,');
});

// Static files
app.use(express.static('public'));

// Variables
var playerToGame = new Map();

// Socket setup & pass server
var io = socket(server);
io.on('connection', (socket) => {

    console.log('made socket connection', socket.id);

    //TODO: add on-leave functionality

    // Host new game
    socket.on('hostGame', function(){
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
                io.sockets.to(socket.id).emit('gameJoined', null); // Not allowed to join two games at once
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
        
        io.sockets.to(socket.id).emit('gameJoined', null); // Failed to join game; either not hosted or already two players
    });

    // Send game state
    socket.on('sendGameState', function(gameState){
        io.sockets.to(gameState.recipient).emit('receiveGameState', gameState);
        // for (let entry of playerToGame.entries()) {
        //     if (entry[1] == playerToGame.get(socket.id)) { // gameId equals this socket's gameId
        //         if (entry[0] != socket.id) {    // but the socketId is different 
        //             io.sockets.to(entry[0]).emit('receiveGameState', gameState);
        //         }
        //     } 
        // }
    });

     // Send game state
     socket.on('lostGame', function(otherGameId){
        io.sockets.to(otherGameId).emit('gameWon');
    });

});
