
class Shapes {
    static TSHAPE = [[1, 0], [0, 0], [-1, 0], [0, 1]];
    static LSHAPE = [[1, 0], [0, 0], [-1, 0], [-1, 1]];
    static JSHAPE = [[1, 0], [0, 0], [-1, 0], [-1, -1]];
    static SSHAPE = [[1, -1], [0, -1], [0, 0], [-1, 0]];
    static ZSHAPE = [[-1, -1], [0, -1], [0, 0], [1, 0]];
    static OSHAPE = [[0, 0], [1, 0], [0, 1], [1, 1]];
    static ISHAPE = [[-1, 0], [0, 0], [1, 0], [2, 0]];
    static SHAPES = [this.TSHAPE, this.LSHAPE, this.JSHAPE, this.SSHAPE, this.ZSHAPE, this.OSHAPE, this.ISHAPE];

    static PURPLE = 'rgba(128, 0, 128, 1)';
    static ORANGE = 'rgba(255, 127, 0, 1)';
    static DARKBLUE = 'rgba(0, 0, 255, 1)';
    static GREEN = 'rgba(0, 255, 0, 1)';
    static RED = 'rgba(255, 0, 0, 1)';
    static YELLOW = 'rgba(255, 255, 0, 1)';
    static LIGHTBLUE = 'rgba(0, 255, 255, 1)';
    static SHAPECOLORS = [this.PURPLE, this.ORANGE, this.DARKBLUE, this.GREEN, this.RED, this.YELLOW, this.LIGHTBLUE];

    static getShape(i) {
        return JSON.parse(JSON.stringify(this.SHAPES[i]));
    }

    static getColor(i) {
        return this.SHAPECOLORS[i];
    }


    static generateType() {
        let r = Math.floor(Math.random() * 100);

        if (r < 15) {return 0;}
        else if (r < 30) {return 1;}
        else if (r < 45) {return 2;}
        else if (r < 60) {return 3;}
        else if (r < 75) {return 4;}
        else if (r < 90) {return 5;} 
        else {return 6;} // lower chance to get piece type 6
    }
}
