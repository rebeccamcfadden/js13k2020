var PLATFORM_COLORS = {
    RED: "red",
    ORANGE: "orange",
    YELLOW: "yellow",
    GREEN: "green",
    BLUE: "blue",
    PURPLE: "purple"
}

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

    getCollisionSide(node) {
        if (this.x <= node.x) {
            if (this.y >= node.y) {
                return 0;
            } else if ((this.y + this.height) > node.y) {
                return 1;
            } else {
                return 2;
            }
        } else {
            if (this.y >= node.y) {
                return 0;
            } else if ((this.y + this.height) < node.y) {
                return 3;
            } else {
                return 2;
            }
        }
    },

    collide(node, grid) {
        this.setColor(node.fill_style);
        if (this.y + (this.height/2) < node.y) {
            swapColor = this.fill_style;
            this.setColor(node.fill_style);
            node.setColor(swapColor);
            this.onGround = true;
            grid.updateNodePositions(node.y - this.y - this.width);
            this.vy = 0;
        }
    },

    isCollision(x1, x2, w1, w2) {
        if ((x1 + w1) >= x2 && x1 <= (x2 + w2)) {
                return true;
        }
        return false;
    },

    checkNodeCollision(node) {
        return this.isCollision(this.x, node.x, this.width, node.width) &&
            this.isCollision(this.y, node.y, this.height, node.height);
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

PlatformerNode.prototype = {
    isCollision(x1, x2, w1, w2) {
        if ((x1 + w1 + 24) >= x2 || (x1 + w1 - 24) >= x2) {
            if (x1 <= (x2 + w2 + 24) || x1 <= (x2 + w2 - 24)) {
                return true;
            }
            return false;
        }
        return false;
    },

    checkOverlap(node) {
        return this.isCollision(this.x, node.x, this.width, node.width) &&
            this.isCollision(this.y, node.y, this.height, node.height);
    },

    setColor(color) {
        this.fill_style = color;
    }
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

    setLevel(t) {
        this.level = 0;
    },

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
        var overlap = false;
        for (var i = 0; i < this.nodes.length; i++) {
            const node2 = this.nodes[i];
            if (node2.checkOverlap(node)) {
                overlap = true;
            }
        }
        if (!overlap) {
            this.nodes.push(node);
        }
    },

    removeNode(node) {
        const nodeIndex = this.nodes.indexOf(node);

        if (nodeIndex != -1)
            this.nodes.splice(nodeIndex, 1);

        this.level++;
        if (node.y > -200) {
            this.addPlatform(node.width);
        }
        
    },

    deg2rad(deg) {
        return deg * (Math.PI / 180)
    },

    distance(x1, x2, dy) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(dy, 2));
    },

    getRandomCoordinates(node, maxR, recursed) {
        let midX = node.x + (node.width / 2);

        let dy = (Math.random() * (64 - 36)) + 64;
        let newY = node.y - dy;
        let newX = Math.random() * (600 - node.width);
        let newMidX = newX + (node.width / 2);

        let plusOrMinus = 1 * (Math.floor(Math.random() * 2) == 1 ? 1 : -1);
        if (Math.abs(newX - node.x) < 48) {
            newX += plusOrMinus * 48;
        }

        if (this.distance(midX, newMidX, dy) > maxR) {
            if (!recursed) {
               this.addPlatform(node.width, true); 
            }
            else {
                for (var i = 0; i < 3; i++) {
                    newX = midX + (Math.random() * maxR * plusOrMinus);
                    
                    newMidX = newX + (node.width / 2);
                    if (this.distance(midX, newMidX, dy) < maxR) {break;}
                }
                
            }
        }
        return {
            x: newX,
            y: newY
        }
    },

    addPlatform(width, recursed = false) {
        let maxR = 72 + 8 * Math.floor(this.level / 24);
        const prev = this.nodes[this.nodes.length - 1];
        coord = this.getRandomCoordinates(prev, maxR, recursed);
        var rand = Math.floor(Math.random() * Object.keys(PLATFORM_COLORS).length);
        var randColorValue = PLATFORM_COLORS[Object.keys(PLATFORM_COLORS)[rand]];
        this.addNode(new PlatformerNode(coord.x, coord.y, width, 5, randColorValue));
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
                actor.collide(node, this);
            }
        }
    },

    updateNodePositions(vy) {
        for (var i = 0; i < this.nodes.length; ++i) {
            node = this.nodes[i];
            node.y -= vy;
            if (node.y > 600 || node.y < -200) {
                this.removeNode(node);
            }
        }
    },

    update(timeStep) {
        for (var i = 0; i < this.actors.length; ++i) {
            const actor = this.actors[i];

            // Move horizontally
            if (actor.vx != 0) {
                var vx = actor.vx * timeStep;
                actor.xp = actor.x;

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

                this.updateNodePositions(vy);
            }
            if (actor.vy >= 0 || actor.onGround) {
                this.checkCollisions(actor);
            }
            
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
            context.fillRect(actor.x - 2, actor.y - 2, actor.width + 4, actor.height + 4);
            context.fillStyle = "white";
            context.fillRect(actor.x, actor.y, actor.width, actor.height);
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
        this.drawActors(context);
        this.drawNodes(context);
    }
};