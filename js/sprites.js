class Sprite {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.isOnGround = false;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
    }

    reset() {
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.isOnGround = false;
    }

    getPosition() {
        return {
            x: this.x,
            y: this.y
        };
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getVelocity() {
        return {
            x: this.velocityX,
            y: this.velocityY
        };
    }

    setVelocity(vx, vy) {
        this.velocityX = vx;
        this.velocityY = vy;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    intersects(other) {
        return !(this.x + this.width < other.x ||
                this.x > other.x + other.width ||
                this.y + this.height < other.y ||
                this.y > other.y + other.height);
    }
}

// Make Sprite class available globally
window.Sprite = Sprite;
