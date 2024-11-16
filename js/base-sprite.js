class Sprite {
    constructor(x, y, width, height) {
        if (typeof x !== 'number' || typeof y !== 'number' || 
            typeof width !== 'number' || typeof height !== 'number') {
            throw new Error('Sprite constructor requires numeric x, y, width, and height');
        }
        
        // Position and dimensions
        this.x = Math.round(x);          // Round to prevent subpixel rendering
        this.y = Math.round(y);
        this.width = Math.round(width);
        this.height = Math.round(height);
        
        // Physics properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.acceleration = 0;
        this.friction = 0.8;
        this.bounce = 0.2;
        
        // State flags
        this.isJumping = false;
        this.isOnGround = false;
        this.isActive = true;
        this.isVisible = true;
        
        // Collision bounds (can be different from render bounds)
        this.collisionOffset = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Store previous position for collision resolution
        this.previousX = this.x;
        this.previousY = this.y;

        // Update position with velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Round position to prevent subpixel rendering
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getCollisionBounds() {
        return {
            x: this.x + this.collisionOffset.x,
            y: this.y + this.collisionOffset.y,
            width: this.width - this.collisionOffset.width,
            height: this.height - this.collisionOffset.height
        };
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    setPosition(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('setPosition requires numeric x and y coordinates');
        }
        this.x = Math.round(x);
        this.y = Math.round(y);
    }

    setVelocity(vx, vy) {
        if (typeof vx !== 'number' || typeof vy !== 'number') {
            throw new Error('setVelocity requires numeric vx and vy values');
        }
        this.velocityX = vx;
        this.velocityY = vy;
    }

    // Check collision with another sprite
    collidesWith(other) {
        if (!this.isActive || !other.isActive) return false;

        const bounds1 = this.getCollisionBounds();
        const bounds2 = other.getCollisionBounds();

        return !(bounds1.x + bounds1.width < bounds2.x ||
                bounds1.x > bounds2.x + bounds2.width ||
                bounds1.y + bounds1.height < bounds2.y ||
                bounds1.y > bounds2.y + bounds2.height);
    }

    // Get collision side with another sprite
    getCollisionSide(other) {
        const bounds1 = this.getCollisionBounds();
        const bounds2 = other.getCollisionBounds();

        const dx = (bounds1.x + bounds1.width / 2) - (bounds2.x + bounds2.width / 2);
        const dy = (bounds1.y + bounds1.height / 2) - (bounds2.y + bounds2.height / 2);
        const width = (bounds1.width + bounds2.width) / 2;
        const height = (bounds1.height + bounds2.height) / 2;
        const crossWidth = width * dy;
        const crossHeight = height * dx;

        if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
            if (crossWidth > crossHeight) {
                return crossWidth > -crossHeight ? 'bottom' : 'left';
            } else {
                return crossWidth > -crossHeight ? 'right' : 'top';
            }
        }
        return null;
    }

    // Reset sprite state
    reset() {
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.isOnGround = false;
        this.isActive = true;
        this.isVisible = true;
    }

    // Get sprite state for debugging
    getState() {
        return {
            position: { x: this.x, y: this.y },
            velocity: { x: this.velocityX, y: this.velocityY },
            dimensions: { width: this.width, height: this.height },
            state: {
                isJumping: this.isJumping,
                isOnGround: this.isOnGround,
                isActive: this.isActive,
                isVisible: this.isVisible
            }
        };
    }
}

window.Sprite = Sprite;
