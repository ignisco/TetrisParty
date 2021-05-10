// Make connection
var socket = io.connect('192.168.10.182:4000');
var otherSocketId;
var sendDataInterval;



var KeyCode = {
    W: "KeyW",
    A: "KeyA",
    S: "KeyS",
    D: "KeyD",
    SPACE: "Space",
    C: "KeyC",
    M: "KeyM",

    UP: "ArrowUp",
    LEFT: "ArrowLeft",
    DOWN: "ArrowDown",
    RIGHT: "ArrowRight"
}


class Game {
    // Opponent Cv/Ctx and score/linesCleared
    static otherGameCv = document.getElementById("otherGameCv");
    static otherGameCtx = otherGameCv.getContext('2d');
    static otherHoldCv = document.getElementById("otherHoldCv");
    static otherHoldCtx = otherHoldCv.getContext('2d');
    static otherNextCv = document.getElementById("otherNextCv");
    static otherNextCtx = otherNextCv.getContext('2d');



    
    // game window variables
    static GAME_GRID_SIZE = 50;
    static GAME_GRID_WIDTH = 10;
    static GAME_GRID_HEIGHT = 24;
    static GAME_WIDTH = this.GAME_GRID_WIDTH * this.GAME_GRID_SIZE;
    static GAME_HEIGHT = this.GAME_GRID_HEIGHT * this.GAME_GRID_SIZE;
    static gameGrid = new Array(this.GAME_GRID_HEIGHT);
    static gameCv = document.getElementById("gameCv");
    static gameCtx = gameCv.getContext('2d');


    // hold window variables
    static HOLD_GRID_SIZE = 40;
    static HOLD_GRID_WIDTH = 6;
    static HOLD_GRID_HEIGHT = 4;
    static HOLD_WIDTH = this.HOLD_GRID_WIDTH * this.HOLD_GRID_SIZE;
    static HOLD_HEIGHT = this.HOLD_GRID_HEIGHT * this.HOLD_GRID_SIZE;
    static holdGrid = new Array(this.HOLD_GRID_HEIGHT);
    static holdCv = document.getElementById("holdCv");
    static holdCtx = holdCv.getContext('2d');


    // next window variables
    static NEXT_GRID_SIZE = this.HOLD_GRID_SIZE;
    static NEXT_GRID_WIDTH = this.HOLD_GRID_WIDTH;
    static NEXT_GRID_HEIGHT = 12;
    static NEXT_WIDTH = this.NEXT_GRID_WIDTH * this.NEXT_GRID_SIZE;
    static NEXT_HEIGHT = this.NEXT_GRID_HEIGHT * this.NEXT_GRID_SIZE;
    static nextGrid = new Array(this.NEXT_GRID_HEIGHT);
    static nextCv = document.getElementById("nextCv");
    static nextCtx = nextCv.getContext('2d');
    


    static score = 0;
    static linesCleared = 0;
    static nextShapes = new Array(3);
    static holdShape;
    static gameController;
    static activeShape;
    static logicTimer;
    static inputTimer;
    static logicTimerTimeout;
    static inputTimerTimeout;

    static activeKeys = new Map();
    static alternativeKeys = new Map();

    static firstPressKeys = new Array(0);

    static REPEATED_KEYS_DELAY = 200; // 200 ms delay
    static canUseHold;
    static gameOver;


    static init() {
        // Setting up default key values to false for activeKeys
        this.setActiveKeys(KeyCode.W, null);
        this.setActiveKeys(KeyCode.A, null);
        this.setActiveKeys(KeyCode.S, null);
        this.setActiveKeys(KeyCode.D, null);
        this.setActiveKeys(KeyCode.SPACE, null);
        this.setActiveKeys(KeyCode.C, null);
        this.setActiveKeys(KeyCode.M, null);

        // Setting up alternative game control keys
        this.alternativeKeys.set(KeyCode.UP, KeyCode.W);
        this.alternativeKeys.set(KeyCode.LEFT, KeyCode.A);
        this.alternativeKeys.set(KeyCode.DOWN, KeyCode.S);
        this.alternativeKeys.set(KeyCode.RIGHT, KeyCode.D);

        // Initializing music player
        //MusicPlayer.init();
    }

    static reset() {

        this.gameOver = false;
        // Resets values. Will also have an effect the first time a new game is started (as opposed to the java version)

        this.gameGrid = new Array(this.GAME_GRID_HEIGHT);
        for (let i = 0; i < this.GAME_GRID_HEIGHT; i++) {
            this.gameGrid[i] = new Array(this.GAME_GRID_WIDTH);
        }
        this.holdGrid = new Array(this.HOLD_GRID_HEIGHT);
        for (let i = 0; i < this.HOLD_GRID_HEIGHT; i++) {
         this.holdGrid[i] = new Array(this.HOLD_GRID_WIDTH);
        }
        this.nextGrid = new Array(this.NEXT_GRID_HEIGHT);
        for (let i = 0; i < this.NEXT_GRID_HEIGHT; i++) {
         this.nextGrid[i] = new Array(this.NEXT_GRID_WIDTH);
        }

        // Resets score and linesCleared
        this.score = 0;
        this.linesCleared = 0;
        this.updateScore();

        // Reset timers; only need to check if one of the timeouts is defined
        if (this.logicTimerTimeout) {
            clearTimeout(this.logicTimerTimeout);
            clearTimeout(this.inputTimerTimeout);
        } 

    }

    static newGame() {

        this.reset();

        this.holdShape = -1;
        this.canUseHold = true;

        for (let i = 0; i < this.nextShapes.length; i++) {
            this.nextShapes[i] = Shapes.generateType();
        }

        this.updateNextShapeQueue();

        // Timer controlling how fast shapes fall
        function logicTimer() {
            Game.update();
            Game.drawPane(Game.gameCv, Game.gameCtx, Game.gameGrid, Game.GAME_GRID_SIZE, 
                Game.GAME_GRID_WIDTH, Game.GAME_GRID_HEIGHT, Game.GAME_WIDTH, Game.GAME_HEIGHT)
            Game.drawPane(Game.holdCv, Game.holdCtx, Game.holdGrid, Game.HOLD_GRID_SIZE, 
                Game.HOLD_GRID_WIDTH, Game.HOLD_GRID_HEIGHT, Game.HOLD_WIDTH, Game.HOLD_HEIGHT)
            if (!Game.gameOver) {
                Game.logicTimerTimeout = window.setTimeout(logicTimer, 250);
            }
        }
        logicTimer();


        // Timer related to how frequently input keys affect the game logic
        function inputTimer() {
            Game.activeKeysHandling();
            if (!Game.gameOver) {
                Game.inputTimerTimeout = window.setTimeout(inputTimer, 1000 / 30);
            }
        }
        inputTimer();

        //MusicPlayer.play();
    }
    

    static renderGridlines(ctx, gridSize, gridWidth, gridHeight, width, height) {

        ctx.strokeStyle = "#555";
        ctx.lineWidth = 4;

        // Horizontal lines
        for (let i = 0; i < gridHeight+1; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(width, i * gridSize);
            ctx.stroke();
        }
        // Vertical lines
        for (let i = 0; i < gridWidth+1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, height);
            ctx.stroke();
        }
    }


    static renderGrid(ctx, grid, gridSize) {
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[0].length; x++) {
                if (grid[y][x] != null) {
                    ctx.beginPath();
                    ctx.fillStyle = grid[y][x];
                    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                }
            }
        }
    }



    static drawPane(cv, ctx, grid, gridSize, gridWidth, gridHeight, width, height) {
        // Removing all objects from last frame
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, cv.width, cv.height);
        
        // Rendering grids
        this.renderGrid(ctx, grid, gridSize);

        // Drawing gridlines
        this.renderGridlines(ctx, gridSize, gridWidth, gridHeight, width, height);
    }



    static updateNextShapeQueue() {

        // Updating list and activeShape
        this.activeShape = new Shape(this.gameGrid, this.nextShapes[0]);

        for (let i = 0; i < this.nextShapes.length-1; i++) {
            this.nextShapes[i] = this.nextShapes[i+1];
        }
        this.nextShapes[this.nextShapes.length-1] = Shapes.generateType();

        // Reseting nextGrid
        this.nextGrid = new Array(this.NEXT_GRID_HEIGHT);
        for (let i = 0; i < this.NEXT_GRID_HEIGHT; i++) {
         this.nextGrid[i] = new Array(this.NEXT_GRID_WIDTH);
        }

        // Updating display
        for (let i = this.nextShapes.length-1; i >= 0; i--) {
            let tempShape = new Shape(this.nextGrid, this.nextShapes[i]);
            tempShape.move(-1, 3);
            for (let j = 1; j <= i; j++) {
                tempShape.move(0, 4);
            }
        }

        this.drawPane(this.nextCv, this.nextCtx, this.nextGrid, this.NEXT_GRID_SIZE, 
            this.NEXT_GRID_WIDTH, this.NEXT_GRID_HEIGHT, this.NEXT_WIDTH, this.NEXT_HEIGHT)
        
    }

    static storeInHold() {

        // Only allowed to use hold once per shape
        if (!this.canUseHold) {
            return;
        }
        this.canUseHold = false;

        // When nothing is already stored
        if (this.holdShape == -1) {
            this.holdShape = this.activeShape.getTypeNumber();
            this.activeShape.removeFromGrid();
            this.updateNextShapeQueue();
        } else {
            let temp = this.holdShape;
            this.holdShape = this.activeShape.getTypeNumber();
            this.activeShape.removeFromGrid();
            this.activeShape = new Shape(this.gameGrid, temp);
        }

        // Reseting holdGrid
        this.holdGrid = new Array(this.HOLD_GRID_HEIGHT);
        for (let i = 0; i < this.HOLD_GRID_HEIGHT; i++) {
         this.holdGrid[i] = new Array(this.HOLD_GRID_WIDTH);
        }

        // Updating display
        let tempShape = new Shape(this.holdGrid, this.holdShape);
        tempShape.move(-1, 3);

        this.drawPane(this.holdCv, this.holdCtx, this.holdGrid, this.HOLD_GRID_SIZE, 
            this.HOLD_GRID_WIDTH, this.HOLD_GRID_HEIGHT, this.HOLD_WIDTH, this.HOLD_HEIGHT)
    }


    static update() {
        
        this.activeShape.update();

        if (!this.activeShape.getAlive() && !this.gameOver) {
            this.addShapePoints();
            //Checking for completed lines
            let lineCounter = 0;
            let y;
            for (y = 0; y < this.GAME_GRID_HEIGHT; y++) {
                if (this.isCompletedLine(y)) {
                    lineCounter++;
                    for (let j = y; j >= 0; j--) {
                        for (let x = 0; x < this.GAME_GRID_WIDTH; x++) {
                            if (j != 0) {
                                this.setGameGrid(x, j, this.getGameGrid(x, j-1));
                            } else {
                                this.setGameGrid(x, j, null);
                            }
                        }
                    }
                }
            }
            this.addLinePoints(lineCounter);
            this.updateScore();
            this.updateNextShapeQueue();
            this.canUseHold = true;

            this.sendBlocks(lineCounter);

        }

    }

    // Send garbage blocks
    static sendBlocks (lineCounter) {
        let data;
        if (lineCounter > 1) {
            socket.emit('sendBlocks', data = {
                lines : lineCounter,
                recipient : otherSocketId
            });
        }
    }

    static isCompletedLine(y) {
        for (let x = 0; x < this.GAME_GRID_WIDTH; x++) {
            if (this.gameGrid[y][x] == null) {
                return false;
            }
        }
        return true;
    }


    static activeKeysHandling() {

        if (this.activeKeys.get(KeyCode.M) != null) {
            this.setActiveKeys(KeyCode.M, null);
        }

        if (this.gameOver) { return; }
        
        if (this.activeKeys.get(KeyCode.A) != null) {
            if (window.performance.now() - this.activeKeys.get(KeyCode.A) >= this.REPEATED_KEYS_DELAY || this.firstPressKeys.includes(KeyCode.A)) {
                if (this.activeShape.canMove(-1, 0)) {
                    this.activeShape.move(-1, 0);
                }
                if (this.firstPressKeys.includes(KeyCode.A)) { 
                    this.firstPressKeys = this.firstPressKeys.filter(k => k != KeyCode.A);
                }
            }
        }
        if (this.activeKeys.get(KeyCode.D) != null) {
            if (window.performance.now() - this.activeKeys.get(KeyCode.D) >= this.REPEATED_KEYS_DELAY || this.firstPressKeys.includes(KeyCode.D)) {
                if (this.activeShape.canMove(1, 0)) {
                    this.activeShape.move(1, 0);
                }
                if (this.firstPressKeys.includes(KeyCode.D)) { 
                    this.firstPressKeys = this.firstPressKeys.filter(k => k != KeyCode.D);
                }
            }
        }
        if (this.activeKeys.get(KeyCode.S) != null) {
            if (this.activeShape.canMove(0, 1)) {
                this.activeShape.move(0, 1);
            }
        }
        if (this.activeKeys.get(KeyCode.W) != null) {
            this.setActiveKeys(KeyCode.W, null);
            this.activeShape.rotate();
        }
        if (this.activeKeys.get(KeyCode.SPACE) != null) {
            while (this.activeShape.canMove(0, 1)) {
                this.activeShape.move(0, 1);
            }
            this.update(); //Sets user control to new block
            this.setActiveKeys(KeyCode.SPACE, null);
        }
        if (this.activeKeys.get(KeyCode.C) != null) {
            this.setActiveKeys(KeyCode.C, null);
            this.storeInHold();
        }
        
        this.drawPane(this.gameCv, this.gameCtx, this.gameGrid, this.GAME_GRID_SIZE, 
            this.GAME_GRID_WIDTH, this.GAME_GRID_HEIGHT, this.GAME_WIDTH, this.GAME_HEIGHT)
    }

    static addShapePoints() {
        // Score added each time a shape is placed
        this.score += 10;
    }

    static addLinePoints(lines) {
        // Score added each time X number of lines are cleared
        this.linesCleared += lines;
        switch (lines) {
            case 1:
                this.score += 40;
                break;
            case 2:
                this.score += 100;
                break;
            case 3:
                this.score += 300;
                break;
            case 4:
                this.score += 1200;
                break;
            default:
                break;
        }
    }

    static updateScore() {
        return;
        scoreText.innerText = 'Score: ' + this.score;
        linesText.innerText = 'Lines: ' + this.linesCleared;   
    }

    static updateOtherScore(score, linesCleared) {
        return;
        otherScoreText.innerText = 'Score: ' + score;
        otherLinesText.innerText = 'Lines: ' + linesCleared;  
    }


    static getGameHeight() {
        return this.GAME_HEIGHT;
    }

    static getGameWidth() {
        return this.GAME_WIDTH;
    }

    static getGameGridSize() {
        return this.GAME_GRID_SIZE;
    }

    static getGameGrid(x, y) {
        return this.gameGrid[y][x];
    }

    static setGameGrid(x, y, color) {
        this.gameGrid[y][x] = color;
    }

    static getGameGridWidth() {
        return this.GAME_GRID_WIDTH;
    }
    
    static getGameGridHeight() {
        return this.GAME_GRID_HEIGHT;
    }

    static getScore() {
        return this.score;
    }

    static setActiveKeys(key, time) {
        this.activeKeys.set(key, time);
    }

    static getActiveKeys(key) {
        return this.activeKeys.get(key);
   }

    // this is an array, not a map
    static addFirstPressKey(key) {
        this.firstPressKeys.push(key);
    }

    static getAlternativeKeys(key) {
        return this.alternativeKeys.get(key);
    }

    static alternativeKeysContainsKey(key) {
        return this.alternativeKeys.has(key);
    }

    static keyIsUsedInGame(key) {
        return this.activeKeys.has(key);
    }

    // Called by Shape.java when game is over
    static setGameOver() {
        this.gameOver = true;
    }

}