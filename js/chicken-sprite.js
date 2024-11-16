class Chicken extends Sprite {
    constructor(x, y) {
        // Initialize with correct dimensions for the sprite
        super(x, y, 48, 48);  // Slightly larger size for better visibility
        
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
        this.spriteLoaded = false;
        this.sprite = null;
        this.spriteWidth = 48;   // Original sprite dimensions
        this.spriteHeight = 48;
        
        // Visual effects
        this.shadowOpacity = 0.3;
        this.glowAmount = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.05;
        
        // Debug logging
        this.debug = document.getElementById('debug');
        
        // Load sprite
        this.loadSprite();
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    loadSprite() {
        if (this.sprite) {
            this.sprite.onload = null;
            this.sprite.onerror = null;
        }

        this.sprite = new Image();
        this.sprite.onload = () => {
            this.log('小鸡精灵图加载成功');
            this.spriteLoaded = true;
            // Update sprite dimensions based on loaded image
            this.spriteWidth = this.sprite.width / 2;  // Two frames in sprite sheet
            this.spriteHeight = this.sprite.height;
        };
        this.sprite.onerror = (error) => {
            this.log('小鸡精灵图加载失败，使用备用图形');
            this.spriteLoaded = false;
        };
        this.sprite.src = 'assets/chicken_2.png';
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
            this.jumpSquish = this.velocityY < 0 ? 0.8 : 1.2;
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

    jump(jumpForce) {
        if (this.isOnGround && !this.isJumping) {
            // Initial jump
            this.velocityY = jumpForce;
            this.isJumping = true;
            this.isOnGround = false;
            this.sustainedJumpTime = 0;
            this.state = 'jumping';
            this.log(`跳跃 - 力度: ${jumpForce}`);
        } else if (this.isJumping && this.sustainedJumpTime < this.maxSustainedJumpTime) {
            // Sustained jump
            this.velocityY += jumpForce * this.sustainedJumpMultiplier * 0.016;  // Assuming 60fps
            this.sustainedJumpTime += 0.016;
            this.log(`持续跳跃 - 力度: ${jumpForce}, 时间: ${this.sustainedJumpTime.toFixed(2)}`);
        }
    }

    move(speed) {
        // Always move right with given speed
        this.velocityX = speed;
    }

    draw(ctx) {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${this.shadowOpacity})`;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width/2,
            this.y + this.height,
            this.width/3,
            this.height/6,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Apply translation and squish for jump animation
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(1/this.jumpSquish, this.jumpSquish);
        
        if (this.spriteLoaded && this.sprite.complete) {
            try {
                // Add glow effect when jumping
                if (this.isJumping) {
                    ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
                    ctx.shadowBlur = 10 + this.glowAmount * 5;
                }

                // Draw sprite frame
                ctx.drawImage(
                    this.sprite,
                    this.animationFrame * this.spriteWidth, 0,  // Source position
                    this.spriteWidth, this.spriteHeight,        // Source size
                    -this.width/2, -this.height/2,              // Destination position
                    this.width, this.height                     // Destination size
                );
            } catch (error) {
                this.log(`绘制精灵图错误: ${error.message}`);
                this.drawFallback(ctx);
            }
        } else {
            this.drawFallback(ctx);
        }
        
        ctx.restore();
    }

    drawFallback(ctx) {
        // Simple colored shape as fallback
        ctx.fillStyle = '#FF5722';  // Orange-red
        ctx.strokeStyle = '#FFA000'; // Gold
        ctx.lineWidth = 2;
        
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(this.width/4, -this.height/6, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.moveTo(this.width/3, 0);
        ctx.lineTo(this.width/2, -this.height/8);
        ctx.lineTo(this.width/2, this.height/8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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
}

window.Chicken = Chicken;
