class Shape {

    shape;
    shadowShape = new Array(0);
    grid;
    gridWidth;
    gridHeight;
    color;
    posX;
    posY;
    lowestBlock;
    alive = true;
    typeNumber;
    shadowColor;
    


    constructor(grid, typeNumber) {
        this.grid = grid;
        this.typeNumber = typeNumber;
        this.gridWidth = grid[0].length;
        this.gridHeight = grid.length;
        this.posX = grid[0].length/2;
        this.shape = Shapes.getShape(typeNumber);
        this.color = Shapes.getColor(typeNumber);
        if (grid.length == Game.getGameGridHeight()) {
            this.shadowShape = new Array(this.shape.length);
            for (let i = 0; i < this.shadowShape.length; i++) {
                this.shadowShape[i] = new Array(this.shape[0].length);
            }
        }
        //this.shadowColor = this.color.substring(0, this.color.length-2) + "0.6)"; // World Record in ugly code
        this.shadowColor = "grey";
        this.lowestBlock = this.getLowestBlock();
        this.posY = 0 - (this.lowestBlock + 1);

        this.activateShadowInGrid();
        this.activateInGrid();
    }

    getLowestBlock() {
        let lowest = 0;
        for (let block of this.shape) {
            lowest = Math.max(block[1], lowest);
        }
        return lowest;
    }

    // Used when storing current shape in hold
    removeFromGrid() {
        this.deactivateShadowInGrid();
        this.deactivateInGrid();
    }

    getTypeNumber() {
        return this.typeNumber;
    }

    setGrid(x, y, color) {
        this.grid[y][x] = color;
    }

    getGrid(x, y) {
        return this.grid[y][x];
    }


    getAlive() {
        return this.alive;
    }

    deactivateInGrid() {
         // Deactivating in GRID
         for (let block of this.shape) {
            let x = this.posX + block[0];
            let y = this.posY + block[1];
            if (y >= 0) {   // Not trying to set those that are yet to enter the frame
                this.setGrid(x, y, null);
            }
         }
    }

    activateInGrid() {
        // Activating in GRID, now that posY has increased
        for (let block of this.shape) {
            let x = this.posX + block[0];
            let y = this.posY + block[1];
            if (y >= 0) {   // Not trying to set those that are yet to enter the frame
                this.setGrid(x, y, this.color);
            }
        }
    }


    activateShadowInGrid() {

        let moveDown = 1;
        while (this.canMoveShadow(0, moveDown)) {
            moveDown += 1;
        }
        moveDown -= 1;

        for (let i = 0; i < this.shadowShape.length; i++) {
            let x = this.posX + this.shape[i][0];
            let y = this.posY + this.shape[i][1] + moveDown;

            if (y >= 0) {   // Not trying to set those that are yet to enter the frame
                this.setGrid(x, y, this.shadowColor);
            }

            // Storing shape in shadowShape
            this.shadowShape[i] = [x, y];
            
        }
    }


    deactivateShadowInGrid() {

        for(let block of this.shadowShape) {
            let x = block[0]; // These are already absolute positions
            let y = block[1];

            if (y >= 0) {   // Not trying to set those that are yet to enter the frame
                this.setGrid(x, y, null);
            }
        }
    }
    
    // Checks if there are still blocks that have yet to enter the grid
    blocksOutsideGrid() {
        for (let block of this.shape) {
            let y = this.posY + block[1];
            if (y < 0) {   // Haven't yet entered grid
                return true;
            }
        }
        return false;
    }
    
    // Attempts to move the shape down by 1 on the y-axis
    // If it can't move downwards, its alive status is set to false.
    update() {

        if (!this.canMove(0, 1)) {
            this.alive = false;
            if (this.blocksOutsideGrid()) {
                Game.setGameOver();
            }
            return;
        }

        this.move(0, 1);

    }

    // Note: Positive direction of y-axis is pointing downwards
    rotateClockwise() {
        for (let block of this.shape) {
            let temp = block[1];
            block[1] = block[0];
            block[0] = -temp;
        }
    }

    // Note: Positive direction of y-axis is pointing downwards
    rotateCounterClockwise() {
        for (let block of this.shape) {
            let temp = block[0];
            block[0] = block[1];
            block[1] = -temp;
        }
    }

    // Rotate helper function
    rotate() {
        // 5 = O-shape. They can't rotate
        if (this.typeNumber == 5) { return; }
        this.deactivateShadowInGrid();
        this.deactivateInGrid();
        this.privateRotate(0);
        this.activateShadowInGrid();
        this.activateInGrid();
    }

    // Renamed because javascript can't distinguish between equally named functions
    privateRotate(offsetX) {
        this.rotateClockwise();

        let toRight = false;
        let toLeft = false;

        let illegalBlocks = this.getIllegalBlocks(offsetX);

        // No illegal blocks means the position is valid
        // No need to readjust the position
        if (illegalBlocks.length == 0) {
            return this.posX + offsetX;
        }

        for (let block of illegalBlocks) {
            if (block[0] > 0) {
                toRight = true;
            }
            if (block[0] < 0) {
                toLeft = true;
            }
        }

        // rotating back
        this.rotateCounterClockwise();

        // !XOR: Block is directly below or on both sides
        // Don't allow rotation
        if ( !(toRight ^ toLeft) || (toLeft && offsetX < 0) || (toRight && offsetX > 0) ) {
            return null;
        }

        if (toRight) {
            let nextLoop = this.privateRotate(offsetX - 1);
            if (nextLoop != null) {
                this.posX = nextLoop;
            }
        }

        if (toLeft) {
            let nextLoop = this.privateRotate(offsetX + 1);
            if (nextLoop != null) {
                this.posX = nextLoop;
            }
        }

        return null;

    }

    getIllegalBlocks(offsetX) {
        let blocks = [];
        for (let block of this.shape) {
            let x = this.posX + block[0] + offsetX;
            let y = this.posY + block[1];
            if (x < 0 || x >= this.gridWidth || y >= this.gridHeight) {
                // Outside of GRID
                // Considering this as an illegal block
                blocks.push([block[0], block[1]]);
            }
            else if (y >= 0) {
                if (this.getGrid(x, y) != null) {
                    blocks.push([block[0], block[1]]);
                }
            }
            
        }
        return blocks;
    }

    canMoveShadow(moveX, moveY) {
        for (let block of this.shape) {
            let x = this.posX + block[0] + moveX;
            let y = this.posY + block[1] + moveY;
            if (x >= this.gridWidth || x < 0 || y >= this.gridHeight) {
                // Is about to exit screen; preventing further movement
                return false;
            }
            if (y >= 0) {
                if (this.getGrid(x, y) != null) {
                    return false;
                }
            }
        }
        return true;
    }

    canMove(moveX, moveY) {
        this.deactivateShadowInGrid();
        this.deactivateInGrid();
        for (let block of this.shape) {
            let x = this.posX + block[0] + moveX;
            let y = this.posY + block[1] + moveY;
            if (x >= this.gridWidth || x < 0 || y >= this.gridHeight) {
                // Is about to exit screen; preventing further movement
                this.activateShadowInGrid();
                this.activateInGrid();
                return false;
            }
            if (y >= 0) {
                if (this.getGrid(x, y) != null) {
                    this.activateShadowInGrid();
                    this.activateInGrid();
                    return false;
                }
            }
        }
        this.activateShadowInGrid();
        this.activateInGrid();
        return true;
    }



    move(x, y) {
        this.deactivateShadowInGrid();
        this.deactivateInGrid();
        this.posX += x;
        this.posY += y;
        this.activateShadowInGrid();
        this.activateInGrid();
    }
}
