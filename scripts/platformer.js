// Grid cell, can have a wall on the left and a ceiling on top
function PlatformerGridCell() {
    this.wall = false;
    this.ceiling = false;
}

// Platformer actor, a dynamic object in the grid
function PlatformerActor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = width;
    this.height = height;
    this.onGround = false;
    this.fill_style = "white";
}

PlatformerActor.prototype = {
    setvx(vx) {
        this.vx = vx;
    },

    setvy(vy) {
        this.vy = vy;

        if (vy != 0)
            this.onGround = false;
    },

    getXCells(resolution) {
        return {
            start: Math.floor((this.x + PlatformerGrid.prototype.EPSILON) / resolution),
            end: Math.floor((this.x + this.width - PlatformerGrid.prototype.EPSILON) / resolution)
        };
    },

    getYCells(resolution) {
        return {
            start: Math.floor((this.y + PlatformerGrid.prototype.EPSILON) / resolution),
            end: Math.floor((this.y + this.height - PlatformerGrid.prototype.EPSILON) / resolution)
        };
    },

    getCellBottom(y, resolution) {
        return Math.floor((y + this.height - PlatformerGrid.prototype.EPSILON) / resolution);
    },

    getCellTop(y, resolution) {
        return Math.floor((y + PlatformerGrid.prototype.EPSILON) / resolution);
    },

    getCellRight(x, resolution) {
        return Math.floor((x + this.width - PlatformerGrid.prototype.EPSILON) / resolution);
    },

    getCellLeft(x, resolution) {
        return Math.floor((x + PlatformerGrid.prototype.EPSILON) / resolution);
    },

    collideCellBottom(resolution) {
        this.onGround = true;
        this.vy = 0;
        this.y = this.getCellBottom(this.y, resolution) * resolution - this.height;
    },

    collideCellTop(resolution) {
        this.vy = 0;
        this.y = this.getCellTop(this.yp, resolution) * resolution;
    },

    collideCellRight(resolution) {
        this.vx = 0;
        this.x = this.getCellRight(this.x, resolution) * resolution - this.width;
    },

    collideCellLeft(resolution) {
        this.vx = 0;
        this.x = this.getCellLeft(this.xp, resolution) * resolution;
    },

    getCollisionSide(node) {
        if (this.x <= node.x) {
            if (this.y < node.y) {
                return 0;
            }
            else if ((this.y + this.height) > node.y) {
                return 1;
            }
            else {
                return 2;
            }
        }
        else {
            if (this.y >= node.y) {
                return 0;
            }
            else if ((this.y + this.height) < node.y) {
                return 3;
            }
            else {
                return 2;
            }
        }
    },

    collide(node) {
        switch (this.getCollisionSide(node)) {
            case 0:
                //bottom collision
                this.vy = 0;
                break;
            case 1:
                //left collision
                this.vx = 0;
                break;
            case 2:
                //top collision
                this.onGround = true;
                this.vy = 0;
                node.y = this.y + this.height;
                break;
            case 3:
                //right collision
                this.vx = 0;
                break;
            default:
                //ERROR
                console.log("ERROR - invalid collision side");
                break;
        }
    },

    isCollision(x1, x2, w1, w2) {
        if ((x1 + w1 + PlatformerGrid.prototype.EPSILON) >= x2 || (x1 + w1 - PlatformerGrid.prototype.EPSILON) >= x2) {
            if (x1 <= (x2 + w2 + PlatformerGrid.prototype.EPSILON) || x1 <= (x2 + w2 - PlatformerGrid.prototype.EPSILON)) {
                return true;
            }
            return false;
        }
        return false;
    },

    checkNodeCollision(node) {
        return this.isCollision(this.x, node.x, this.width, node.width) &&
            this.isCollision(this.y, node.y, this.height, node.height);
    },

    limitXSpeed(timeStep) {
        if (this.vx * timeStep < -this.width + PlatformerGrid.prototype.EPSILON)
            this.vx = (-this.width + PlatformerGrid.prototype.EPSILON) / timeStep;

        if (this.vx * timeStep > this.width - PlatformerGrid.prototype.EPSILON)
            this.vx = (this.width - PlatformerGrid.prototype.EPSILON) / timeStep;
    },

    limitYSpeed(timeStep) {
        if (this.vy * timeStep < -this.height + PlatformerGrid.prototype.EPSILON)
            this.vy = (-this.height + PlatformerGrid.prototype.EPSILON) / timeStep;

        if (this.vy * timeStep > this.height - PlatformerGrid.prototype.EPSILON)
            this.vy = (this.height - PlatformerGrid.prototype.EPSILON) / timeStep;
    },

    getColor() {
        return this.fill_style;
    },

    setColor(color) {
        this.fill_style = color;
    }
};

function PlatformerNode(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = width;
    this.height = height;
    this.onGround = false;
    this.fill_style = color;
}

// The grid, containing cells and actors colliding with cell walls
function PlatformerGrid(width, height, resolution, gravity = 2500, friction = 1700) {
    this.width = width + 1;
    this.height = height + 1;
    this.resolution = resolution;
    this.gravity = gravity;
    this.friction = friction;
    this.cells = [];
    this.actors = [];
    this.nodes = [];

    for (var i = 0; i < this.width * this.height; ++i)
        this.cells.push(new PlatformerGridCell());
}

PlatformerGrid.prototype = {
    EDGE_STROKE_STYLE: "blue",
    EDGE_LINE_WIDTH: 4,
    GRID_STROKE_STYLE: "gray",
    GRID_LINE_WIDTH: 0.5,
    EPSILON: 0.0000001,

    validateCoordinates(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return false;

        return true;
    },

    getCell(x, y) {
        return this.cells[x + y * this.width];
    },

    getWall(x, y) {
        if (!this.validateCoordinates(x, y))
            return false;

        return this.getCell(x, y).wall;
    },

    getCeiling(x, y) {
        if (!this.validateCoordinates(x, y))
            return false;

        return this.getCell(x, y).ceiling;
    },

    setWall(x, y, wall) {
        if (this.validateCoordinates(x, y))
            this.getCell(x, y).wall = wall;
    },

    setCeiling(x, y, ceiling) {
        if (this.validateCoordinates(x, y))
            this.getCell(x, y).ceiling = ceiling;
    },

    addNode(node) {
        this.nodes.push(node);
    },

    removeNode(node) {
        const nodeIndex = this.nodes.indexOf(node);

        if (nodeIndex != -1)
            this.nodes.splice(nodeIndex, 1);
    },

    addActor(actor) {
        this.actors.push(actor);
    },

    removeActor(actor) {
        const actorIndex = this.actors.indexOf(actor);

        if (actorIndex != -1)
            this.actors.splice(actorIndex, 1);
    },

    checkCollisions(actor) {
        for (var i = 0; i < this.nodes.length; ++i) {
            const node = this.nodes[i];
            if (actor.checkNodeCollision(node)) {
                actor.collide(node);
            }
        }
    },

    updateNodePositions(vy) {
        for (var i = 0; i < this.nodes.length; ++i) {
            node = this.nodes[i];
            node.y -= vy;
        }
    },

    update(timeStep) {
        for (var i = 0; i < this.actors.length; ++i) {
            const actor = this.actors[i];

            // Move horizontally
            if (actor.vx != 0) {
                var vx = actor.vx * timeStep;
                actor.xp = actor.x;
                
                actor.limitXSpeed(timeStep);
                actor.x += vx;

                // Check if actor is still on ground
                if (actor.onGround) {
                    for (var i = 0; i < this.nodes.length; i++) {
                        actor.onGround = false;
                        node = this.nodes[i];

                        if (actor.checkNodeCollision(node) && actor.getCollisionSide(node) == 2) {
                            actor.onGround = true;
                            break;
                        }
                    }
                }

                // Apply friction if on ground
                if (actor.onGround) {
                    if (actor.vx > 0) {
                        actor.vx -= this.friction * timeStep;

                        if (actor.vx < 0)
                            actor.vx = 0;
                    } else if (actor.vx < 0) {
                        actor.vx += this.friction * timeStep;

                        if (actor.vx > 0)
                            actor.vx = 0;
                    }
                }
            }

            // Add gravity
            if (!actor.onGround) {
                actor.vy += this.gravity * timeStep;
            }

            // Mover vertically
            if (actor.vy != 0) {
                var vy = actor.vy * timeStep;
                actor.yp = actor.y;
                // actor.y += vy;
                
                // actor.limitYSpeed(timeStep); // Dont actually know what this does lol
                this.updateNodePositions(vy);
            }

            this.checkCollisions(actor);
        }
    },

    drawGrid(context) {
        context.strokeStyle = this.GRID_STROKE_STYLE;
        context.lineWidth = this.GRID_LINE_WIDTH;

        for (var y = 0; y < this.height; ++y) {
            context.beginPath();
            context.moveTo(0, y * this.resolution);
            context.lineTo(this.width * this.resolution, y * this.resolution);
            context.stroke();
        }

        for (var x = 0; x < this.width; ++x) {
            context.beginPath();
            context.moveTo(x * this.resolution, 0);
            context.lineTo(x * this.resolution, this.height * this.resolution);
            context.stroke();
        }
    },

    drawActors(context) {
        for (var i = 0; i < this.actors.length; ++i) {
            const actor = this.actors[i];

            context.fillStyle = actor.fill_style;
            context.beginPath();
            context.rect(actor.x, actor.y, actor.width, actor.height);
            context.fill();
        }
    },

    drawNodes(context) {
        for (var i = 0; i < this.nodes.length; ++i) {
            const actor = this.nodes[i];

            context.fillStyle = actor.fill_style;
            context.beginPath();
            context.rect(actor.x, actor.y, actor.width, actor.height);
            context.fill();
        }
    },

    draw(context) {
        this.drawGrid(context);
        // this.drawWalls(context);
        this.drawActors(context);
        this.drawNodes(context);
    }
};