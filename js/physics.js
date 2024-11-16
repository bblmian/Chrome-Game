class PhysicsEngine {
    constructor() {
        // Physics settings
        this.gravity = 900;           // Gravity force
        this.terminalVelocity = 800;  // Maximum falling speed
        this.groundFriction = 0.8;    // Ground friction
        this.airResistance = 0.98;    // Air resistance
        
        // Collision settings
        this.collisionPadding = 2;    // Small padding to prevent getting stuck
        this.platformBuffer = 5;      // Buffer zone for platform edges
        this.groundBuffer = 1;        // Buffer for ground detection
        this.fallThreshold = 500;     // 掉落检测阈值
        
        // Hazard platform settings
        this.hazardWarningTime = 2000;  // 危险平台警告时间（2秒）
        this.hazardPlatforms = new Map(); // 存储危险平台的状态
        
        // Game objects
        this.player = null;
        this.platforms = null;
        this.flag = null;
        
        // Debug logging
        this.debug = document.getElementById('debug');
        
        // Debug flags
        this.debugCollisions = false;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    initialize(player, platforms, flag) {
        this.player = player;
        this.platforms = platforms;
        this.flag = flag;
    }

    update(deltaTime) {
        if (!this.player || !this.platforms) return 'error';

        try {
            // Store previous position for collision resolution
            const prevX = this.player.x;
            const prevY = this.player.y;

            // Apply gravity if not on ground
            if (!this.player.isOnGround) {
                this.player.velocityY += this.gravity * deltaTime;
                
                // Limit falling speed
                if (this.player.velocityY > this.terminalVelocity) {
                    this.player.velocityY = this.terminalVelocity;
                }
            }

            // Update position
            const nextX = this.player.x + this.player.velocityX * deltaTime;
            const nextY = this.player.y + this.player.velocityY * deltaTime;

            // Reset ground state before collision checks
            const wasOnGround = this.player.isOnGround;
            this.player.isOnGround = false;

            // Get potential colliding platforms
            const nearbyPlatforms = this.platforms.filter(platform => 
                Math.abs(platform.x - nextX) < platform.width + this.player.width &&
                Math.abs(platform.y - nextY) < platform.height + this.player.height
            );

            // Update player position for collision checks
            this.player.x = nextX;
            this.player.y = nextY;

            // Check collisions with nearby platforms
            let collidingPlatform = null;
            for (const platform of nearbyPlatforms) {
                if (this.checkCollision(this.player, platform)) {
                    collidingPlatform = platform;
                    
                    // Handle hazard platform
                    if (platform.type === 'hazard') {
                        const now = Date.now();
                        if (!this.hazardPlatforms.has(platform)) {
                            // 第一次碰到危险平台，开始计时和警告
                            this.hazardPlatforms.set(platform, now);
                            platform.setWarning();
                            this.log(`危险平台警告开始: ${platform.x}, ${platform.y}`);
                        } else {
                            // 检查是否超过警告时间
                            const startTime = this.hazardPlatforms.get(platform);
                            if (now - startTime >= this.hazardWarningTime) {
                                platform.startFalling();
                                // 如果玩家在坠落的平台上，游戏结束
                                if (this.player.isOnGround) {
                                    return 'lose';
                                }
                            }
                        }
                    }

                    // 如果平台正在坠落且玩家在上面，游戏结束
                    if (platform.isFalling && this.player.isOnGround) {
                        return 'lose';
                    }

                    // Resolve collision
                    const collision = this.resolveCollision(
                        this.player, platform, prevX, prevY
                    );

                    if (collision.fromTop) {
                        this.player.isOnGround = true;
                        this.player.isJumping = false;
                        this.player.velocityY = 0;
                        
                        // Snap to platform top
                        this.player.y = platform.y - this.player.height + this.groundBuffer;
                    } else if (collision.fromBottom) {
                        this.player.velocityY = Math.max(0, this.player.velocityY);
                        this.player.y = platform.y + platform.height + this.collisionPadding;
                    }

                    if (collision.fromLeft || collision.fromRight) {
                        this.player.velocityX = 0;
                        if (collision.fromLeft) {
                            this.player.x = platform.x - this.player.width - this.collisionPadding;
                        } else {
                            this.player.x = platform.x + platform.width + this.collisionPadding;
                        }
                    }

                    // Log collision for debugging
                    if (this.debugCollisions) {
                        this.log(`碰撞检测 - 平台类型:${platform.type}, ` +
                                `方向:${JSON.stringify(collision)}`);
                    }
                } else {
                    // 如果不再碰撞，移除平台的警告状态
                    this.hazardPlatforms.delete(platform);
                }
            }

            // Apply friction when on ground
            if (this.player.isOnGround) {
                this.player.velocityX *= this.groundFriction;
                if (Math.abs(this.player.velocityX) < 0.1) {
                    this.player.velocityX = 0;
                }
            } else {
                // Apply air resistance
                this.player.velocityX *= this.airResistance;
            }

            // Update platforms
            for (const platform of this.platforms) {
                platform.update(deltaTime);
            }

            // Log state changes for debugging
            if (wasOnGround !== this.player.isOnGround) {
                this.log(`地面状态改变: ${wasOnGround} -> ${this.player.isOnGround}`);
            }

            // Check if player fell off
            if (this.player.y > this.platforms[0].y + this.fallThreshold) {
                return 'lose';
            }

            // Check if player reached flag
            if (this.flag && this.checkCollision(this.player, this.flag)) {
                return 'win';
            }

            // Log physics state occasionally
            if (Math.random() < 0.01) {
                this.log(`物理状态 - 位置:(${Math.round(this.player.x)}, ${Math.round(this.player.y)}), ` +
                        `速度:(${Math.round(this.player.velocityX)}, ${Math.round(this.player.velocityY)}), ` +
                        `在地面:${this.player.isOnGround}`);
            }

            return 'playing';

        } catch (error) {
            this.log(`物理更新错误: ${error.message}`);
            console.error(error);
            return 'error';
        }
    }

    checkCollision(a, b) {
        // Add platform buffer to improve edge detection
        return !(a.x + a.width - this.platformBuffer <= b.x ||
                a.x + this.platformBuffer >= b.x + b.width ||
                a.y + a.height <= b.y ||
                a.y >= b.y + b.height);
    }

    resolveCollision(player, platform, prevX, prevY) {
        const result = {
            fromTop: false,
            fromBottom: false,
            fromLeft: false,
            fromRight: false
        };

        // Calculate collision depths
        const overlapX = (player.width + platform.width) / 2 -
                        Math.abs((player.x + player.width/2) -
                                (platform.x + platform.width/2));
        const overlapY = (player.height + platform.height) / 2 -
                        Math.abs((player.y + player.height/2) -
                                (platform.y + platform.height/2));

        // Determine collision direction based on previous position and overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (prevX + player.width/2 < platform.x + platform.width/2) {
                result.fromRight = true;
            } else {
                result.fromLeft = true;
            }
        } else {
            // Vertical collision
            if (prevY + player.height/2 < platform.y + platform.height/2) {
                result.fromTop = true;
            } else {
                result.fromBottom = true;
            }
        }

        return result;
    }

    getState() {
        if (!this.player) return null;
        
        return {
            playerPosition: {
                x: this.player.x,
                y: this.player.y
            },
            playerVelocity: {
                x: this.player.velocityX,
                y: this.player.velocityY
            },
            isOnGround: this.player.isOnGround,
            isJumping: this.player.isJumping
        };
    }
}

window.PhysicsEngine = PhysicsEngine;
