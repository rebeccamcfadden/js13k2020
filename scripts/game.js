function Game() {
    var canvas = this.getCanvas();

    this.gridX = this.gridY = -1;
    this.gridWall = true;

    this.jumpDown = false;
    this.leftDown = false;
    this.rightDown = false;

    // Create a grid with a floor over its entire width
    this.grid = new PlatformerGrid(
        Math.floor(canvas.width / this.GRID_RESOLUTION),
        Math.floor(canvas.height / this.GRID_RESOLUTION),
        this.GRID_RESOLUTION);

    // for (var x = 0; x < this.grid.width; ++x)
    //     this.grid.setCeiling(x, this.grid.height - 1, true);

    this.start = new PlatformerNode((canvas.width - this.PLATFORM_WIDTH)/2, (this.grid.height) * this.GRID_RESOLUTION, this.PLATFORM_WIDTH, 5, "green");
    this.grid.addNode(this.start);
    
    this.grid.setLevel(0);
    
    for (var i = 0; i < 8; i++) {
        this.grid.addPlatform(this.PLATFORM_WIDTH);
    }

    // Create a player
    this.player = new PlatformerActor(
        this.PLAYER_SPAWN_X,
        this.PLAYER_SPAWN_Y,
        this.PLAYER_SIZE,
        this.PLAYER_SIZE);
    this.grid.addActor(this.player);

    this.addListeners();
};

Game.prototype = {
    GRID_RESOLUTION: 32,
    PLAYER_SIZE: 24,
    PLAYER_JUMP_SPEED: -750,
    PLAYER_WALK_SPEED: 270,
    PLAYER_WALK_ACCELERATION: 3500,
    PLAYER_SPAWN_X: 288,
    PLAYER_SPAWN_Y: 300,
    KEY_JUMP: 87,
    KEY_LEFT: 65,
    KEY_RIGHT: 68,
    PLATFORM_WIDTH: 120,

    addListeners() {
        window.addEventListener("keydown", this.keyDown.bind(this));
        window.addEventListener("keyup", this.keyUp.bind(this));
    },

    getCanvas() {
        return document.getElementById("renderer");
    },

    run() {
        this.lastTime = new Date();

        window.requestAnimationFrame(this.animate.bind(this));
    },

    keyDown(e) {
        switch (e.keyCode) {
            case this.KEY_JUMP:
                if (!this.jumpDown && this.player.onGround) {
                    this.jumpDown = true;
                    this.player.setvy(this.PLAYER_JUMP_SPEED);
                }

                break;
            case this.KEY_RIGHT:
                this.rightDown = true;
                break;
            case this.KEY_LEFT:
                this.leftDown = true;
                break;
        }
    },

    keyUp(e) {
        switch (e.keyCode) {
            case this.KEY_JUMP:
                this.jumpDown = false;
                break;
            case this.KEY_RIGHT:
                this.rightDown = false;
                break;
            case this.KEY_LEFT:
                this.leftDown = false;
                break;
        }
    },

    animate() {
        var time = new Date();
        var timeStep = (time.getMilliseconds() - this.lastTime.getMilliseconds()) / 1000;
        if (timeStep < 0)
            timeStep += 1;

        this.lastTime = time;

        this.movePlayer(timeStep);
        this.grid.update(timeStep);
        this.render(timeStep);

        window.requestAnimationFrame(this.animate.bind(this));
    },

    movePlayer(timeStep) {
        if (this.rightDown) {
            this.player.setvx(Math.min(this.player.vx + this.PLAYER_WALK_ACCELERATION * timeStep, this.PLAYER_WALK_SPEED));
        }

        if (this.leftDown) {
            this.player.setvx(Math.max(this.player.vx - this.PLAYER_WALK_ACCELERATION * timeStep, -this.PLAYER_WALK_SPEED));
        }
        
        if (this.player.x < 0) {
            this.player.x = 0;
        }
        else if (this.player.x + this.player.width > this.getCanvas().width) {
            this.player.x = this.getCanvas().width - this.player.width;
        }
    },

    render(timeStep) {
        var canvas = this.getCanvas();
        var context = canvas.getContext("2d");

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "black";
        context.beginPath();
        context.rect(0, 0, canvas.width, canvas.height);
        context.fill();

        this.grid.draw(context);

    }
};