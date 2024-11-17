class BaseSprite {
    constructor(options) {
        this.game = options.game;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 40;
        this.height = options.height || 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpForce = -500 * this.game.scale;  // 缩放跳跃力
        this.moveSpeed = 300 * this.game.scale;   // 缩放移动速度
    }

    updateSize(scale) {
        // 保持相对位置不变
        this.x = (this.x / this.game.scale) * scale;
        this.y = (this.y / this.game.scale) * scale;
        this.width = (this.width / this.game.scale) * scale;
        this.height = (this.height / this.game.scale) * scale;
        
        // 更新物理参数
        this.jumpForce = -500 * scale;
        this.moveSpeed = 300 * scale;
    }

    moveLeft() {
        this.velocityX = -this.moveSpeed;
    }

    moveRight() {
        this.velocityX = this.moveSpeed;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }
    }

    update() {
        // 应用摩擦力
        this.velocityX *= 0.9;

        // 限制最大速度
        const maxSpeed = this.moveSpeed * 1.5;
        this.velocityX = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocityX));
    }

    render(ctx) {
        ctx.fillStyle = '#FFD700';  // 金色
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}
