const INVALID = -1, ALIVE = 0, DAZZLED = 1, DEAD = 2;
class Ghost {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        range,
        index
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = DIRECTION_RIGHT;
        this.range = range;
        this.randomTargetIndex = parseInt(Math.random() * 4);
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
        setInterval(() => {
            this.changeRandomDirection();
        }, 10000);
        this.state = INVALID;
        this.image = null;
        this.index = index;
        this.lastDazzle = null;
    }
    //define what the different ghost states do
    setState(state) {
        if (state == DAZZLED)
            this.lastDazzle = Date.now();
        if (state == this.state)
            return
        if (state == ALIVE) {
            this.image = ghostFrames;
            this.imageX = ghostImageLocations[this.index].x;
            this.imageY = ghostImageLocations[this.index].y;
            this.imageWidth = 124;
            this.imageHeight = 116;
        }
        else if (state == DAZZLED) {
            this.image = ghostDazzled;
            this.imageX = 0;
            this.imageY = 0;
            this.imageWidth = ghostDazzled.width;
            this.imageHeight = ghostDazzled.height;
        }
        else if (state == DEAD) {
            this.image = ghostDead;
            this.imageX = 0;
            this.imageY = 0;
            this.imageWidth = ghostDead.width;
            this.imageHeight = ghostDead.height;
        }
        this.state = state;
    }
    isInRange() {
        let xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        let yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        return Math.sqrt(xDistance * xDistance + yDistance * yDistance) <= this.range;
    }

    changeRandomDirection() {
        if (this.state == DEAD)
            return;
        let addition = 1;
        this.randomTargetIndex += addition;
        this.randomTargetIndex = this.randomTargetIndex % 4;
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
    }
    //principal function for controling ghost movement
    moveProcess() {
        switch(this.state){
            case DEAD: 
            this.target = {x:oneBlockSize * 9, y:oneBlockSize * 11};
            if(this.x >= this.target.x && this.y >= this.target.y && 
                this.x <= this.target.x + oneBlockSize && this.y <= this.target.y + oneBlockSize){
                this.setState(ALIVE);
            }
            this.changeDirectionIfPossible();
                this.moveForwards();
                if (this.checkCollisions()) {
                    this.moveBackwards();
                    this.changeRandomDirection();
                }
            break;

            case ALIVE:
                if (this.isInRange()) {
                    this.target = { x: pacman.x, y: pacman.y };
                } else {
                    this.target = randomTargetsForGhosts[this.randomTargetIndex];
                }
                this.changeDirectionIfPossible();
                this.moveForwards();
                if (this.checkCollisions()) {
                    this.moveBackwards();
                    this.changeRandomDirection();
                }
                break;

            case DAZZLED:
                this.target = randomTargetsForGhosts[this.randomTargetIndex];
            
            this.changeDirectionIfPossible();
            this.moveForwards();
            if (this.checkCollisions()) {
                this.moveBackwards();
                this.changeRandomDirection();
            }
            break;
            default:
                console.log("idk");
        }
    }

    moveBackwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT:
                this.x -= this.speed;
                break;
            case DIRECTION_UP:
                this.y += this.speed;
                break;
            case DIRECTION_LEFT:
                this.x += this.speed;
                break;
            case DIRECTION_BOTTOM:
                this.y -= this.speed;
                break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT:
                this.x += this.speed;
                break;
            case DIRECTION_UP:
                this.y -= this.speed;
                break;
            case DIRECTION_LEFT:
                this.x -= this.speed;
                break;
            case DIRECTION_BOTTOM:
                this.y += this.speed;
                break;
        }
    }

    checkCollisions() {
        let isCollided = false;
        if (
            map[parseInt(this.y / oneBlockSize)][parseInt(this.x / oneBlockSize)] == 1 ||
            map[parseInt(this.y / oneBlockSize + 0.9999)][parseInt(this.x / oneBlockSize)] == 1 ||
            map[parseInt(this.y / oneBlockSize)][parseInt(this.x / oneBlockSize + 0.9999)] == 1 ||
            map[parseInt(this.y / oneBlockSize + 0.9999)][parseInt(this.x / oneBlockSize + 0.9999)] == 1
        ) {
            isCollided = true;
        }
        return isCollided;
    }

    changeDirectionIfPossible() {
        let tempDirection = this.direction;
        this.direction = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize),
            parseInt(this.target.y / oneBlockSize)
        );
        if (typeof this.direction == "undefined") {
            this.direction = tempDirection;
            return;
        }
        if (
            this.getMapY() != this.getMapYRightSide() &&
            (this.direction == DIRECTION_LEFT || this.direction == DIRECTION_RIGHT)
        ) {
            this.direction = DIRECTION_UP;
        }
        if (
            this.getMapX() != this.getMapXRightSide() &&
            this.direction == DIRECTION_UP
        ) {
            this.direction = DIRECTION_LEFT;
        }
        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
    }

    calculateNewDirection(map, destX, destY) {
        let mp = [];
        for (let i = 0; i < map.length; i++) {
            mp[i] = map[i].slice();
        }

        let queue = [
            {
                x: this.getMapX(),
                y: this.getMapY(),
                rightX: this.getMapXRightSide(),
                rightY: this.getMapYRightSide(),
                moves: [],
            },
        ];
        while (queue.length > 0) {
            let poped = queue.shift();
            if (poped.x == destX && poped.y == destY) {
                return poped.moves[0];
            } else {
                mp[poped.y][poped.x] = 1;
                let neighborList = this.addNeighbors(poped, mp);
                for (let i = 0; i < neighborList.length; i++) {
                    queue.push(neighborList[i]);
                }
            }
        }

        return DIRECTION_RIGHT; // Default direction
    }

    addNeighbors(poped, mp) {
        let queue = [];
        let numOfRows = mp.length;
        let numOfColumns = mp[0].length;

        if (
            poped.x - 1 >= 0 &&
            mp[poped.y][poped.x - 1] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_LEFT);
            queue.push({ x: poped.x - 1, y: poped.y, moves: tempMoves });
        }
        if (
            poped.x + 1 < numOfColumns &&
            mp[poped.y][poped.x + 1] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_RIGHT);
            queue.push({ x: poped.x + 1, y: poped.y, moves: tempMoves });
        }
        if (
            poped.y - 1 >= 0 &&
            mp[poped.y - 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_UP);
            queue.push({ x: poped.x, y: poped.y - 1, moves: tempMoves });
        }
        if (
            poped.y + 1 < numOfRows &&
            mp[poped.y + 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_BOTTOM);
            queue.push({ x: poped.x, y: poped.y + 1, moves: tempMoves });
        }
        return queue;
    }

    getMapX() {
        return parseInt(this.x / oneBlockSize);
    }

    getMapY() {
        return parseInt(this.y / oneBlockSize);
    }

    getMapXRightSide() {
        return parseInt((this.x + this.width - 1) / oneBlockSize);
    }

    getMapYRightSide() {
        return parseInt((this.y + this.height - 1) / oneBlockSize);
    }

    draw() {
        canvasContext.save();
        canvasContext.drawImage(
            this.image,
            this.imageX,
            this.imageY,
            this.imageWidth,
            this.imageHeight,
            this.x,
            this.y,
            this.width,
            this.height
        );
        canvasContext.restore();
    }
}

let updateGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        if (ghosts[i].state == DAZZLED && Date.now() - ghosts[i].lastDazzle > 8000)
            ghosts[i].setState(ALIVE);
        ghosts[i].moveProcess();    
    }
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};
