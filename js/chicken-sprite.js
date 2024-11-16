class Chicken extends Sprite {
    constructor(x, y) {
        // 创建一个固定大小的正方形容器 (48x48)
        const containerSize = 48;
        super(x, y, containerSize, containerSize);
        
        // Movement properties
        this.jumpForce = -500;
        this.moveSpeed = 500;
        this.gravity = 900;
        this.sustainedJumpMultiplier = 0.7;
        this.maxSustainedJumpTime = 0.5;
        this.sustainedJumpTime = 0;
        
        // Animation properties
        this.state = 'idle';
        this.frameCount = 0;
        this.animationFrame = 0;
        this.animationSpeed = 6;
        this.jumpSquish = 1.0;
        
        // Sprite properties
        this.facingRight = true;
        this.spriteLoaded = true; // 始终为true，因为我们直接绘制
        
        // Visual effects
        this.glowAmount = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.05;
        
        // Colors
        this.bodyColor = '#FFE135';     // 鸡身体黄色
        this.beakColor = '#FF7F00';     // 鸡嘴橙色
        this.eyeColor = '#000000';      // 眼睛黑色
        this.legColor = '#FF4500';      // 腿部橙红色
        
        // Debug logging
        this.debug = document.getElementById('debug');
    }

    // 添加移动方法
    move(speed) {
        this.velocityX = speed;
        this.facingRight = speed > 0;
    }

    // 添加跳跃方法
    jump(force) {
        if (!this.isJumping) {
            this.velocityY = force;
            this.isJumping = true;
            this.isOnGround = false;
        }
    }

    update(deltaTime) {
        // Apply gravity if not on ground
        if (!this.isOnGround) {
            this.velocityY += this.gravity * deltaTime;
        }

        // Update position
        super.update(deltaTime);

        // Update animation
        if (Math.abs(this.velocityX) > 1) {
            this.frameCount++;
            if (this.frameCount >= this.animationSpeed) {
                this.frameCount = 0;
                this.animationFrame = (this.animationFrame + 1) % 2;
            }
            this.state = 'running';
        } else {
            this.animationFrame = 0;
            this.state = this.isJumping ? 'jumping' : 'idle';
        }

        // Update jump squish animation
        if (this.isJumping) {
            this.jumpSquish = this.velocityY < 0 ? 0.9 : 1.1;
        } else {
            this.jumpSquish = 1.0;
        }

        // Update glow effect
        this.glowAmount += this.glowSpeed * this.glowDirection;
        if (this.glowAmount >= 1) {
            this.glowAmount = 1;
            this.glowDirection = -1;
        } else if (this.glowAmount <= 0) {
            this.glowAmount = 0;
            this.glowDirection = 1;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // 移动到容器中心
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // 应用跳跃挤压效果
        ctx.scale(this.jumpSquish, 1/this.jumpSquish);
        
        // 根据运动方向翻转
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        const size = Math.min(this.width, this.height);
        const halfSize = size / 2;
        
        try {
            // 绘制像素风格的小鸡
            ctx.translate(-halfSize, -halfSize);
            
            // 身体（圆形）
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.arc(halfSize, halfSize, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            
            // 头部（圆形）
            ctx.beginPath();
            ctx.arc(halfSize + size * 0.15, halfSize - size * 0.15, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼睛
            ctx.fillStyle = this.eyeColor;
            ctx.beginPath();
            ctx.arc(halfSize + size * 0.25, halfSize - size * 0.2, size * 0.05, 0, Math.PI * 2);
            ctx.fill();
            
            // 鸡冠（三角形）
            ctx.fillStyle = this.legColor;
            ctx.beginPath();
            ctx.moveTo(halfSize + size * 0.1, halfSize - size * 0.4);
            ctx.lineTo(halfSize + size * 0.3, halfSize - size * 0.45);
            ctx.lineTo(halfSize + size * 0.2, halfSize - size * 0.25);
            ctx.closePath();
            ctx.fill();
            
            // 鸡嘴
            ctx.fillStyle = this.beakColor;
            ctx.beginPath();
            ctx.moveTo(halfSize + size * 0.4, halfSize - size * 0.15);
            ctx.lineTo(halfSize + size * 0.5, halfSize - size * 0.1);
            ctx.lineTo(halfSize + size * 0.4, halfSize - size * 0.05);
            ctx.closePath();
            ctx.fill();
            
            // 腿（根据动画帧改变位置）
            ctx.fillStyle = this.legColor;
            const legOffset = this.animationFrame * size * 0.1;
            
            // 左腿
            ctx.fillRect(
                halfSize - size * 0.2 - legOffset,
                halfSize + size * 0.3,
                size * 0.1,
                size * 0.2
            );
            
            // 右腿
            ctx.fillRect(
                halfSize + size * 0.1 + legOffset,
                halfSize + size * 0.3,
                size * 0.1,
                size * 0.2
            );
            
        } catch (error) {
            this.log(`绘制小鸡错误: ${error.message}`);
        }
        
        ctx.restore();
    }

    reset() {
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.isOnGround = false;
        this.sustainedJumpTime = 0;
        this.state = 'idle';
        this.frameCount = 0;
        this.animationFrame = 0;
        this.jumpSquish = 1.0;
    }

    stopSustainedJump() {
        this.sustainedJumpTime = this.maxSustainedJumpTime;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }
}

window.Chicken = Chicken;
