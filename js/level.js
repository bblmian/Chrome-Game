class Level {
    constructor(width, height) {
        // Verify required classes
        if (typeof Platform === 'undefined') {
            throw new Error('Platform class must be loaded before Level');
        }
        if (typeof Flag === 'undefined') {
            throw new Error('Flag class must be loaded before Level');
        }

        this.width = width;
        this.height = height;
        
        // Level boundaries
        this.minY = height * 0.3;     // Platforms start at 30% from top
        this.maxY = height * 0.7;     // Platforms end at 70% from top
        this.groundY = height * 0.75;  // Ground level at 75% from top
        
        // Platform settings
        this.minPlatformWidth = 100;
        this.maxPlatformWidth = 200;
        this.minGap = 120;            // Minimum gap between platforms
        this.maxGap = 200;            // Maximum gap between platforms
        this.platformHeight = 30;      // Platform height
        
        // Level data
        this.playerStart = { x: 50, y: this.groundY - 50 };  // Start position above ground
        this.platforms = [];
        this.flag = null;
        
        // Debug logging
        this.debug = document.getElementById('debug');
        
        try {
            this.generate();
        } catch (error) {
            this.log(`关卡生成错误: ${error.message}`);
            throw error;
        }
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    generate() {
        this.platforms = [];
        
        try {
            // Generate starting ground platform (wider and taller)
            const groundPlatform = new Platform(
                0,                  // x
                this.groundY,       // y
                400,               // Wider starting platform
                50,                // Taller ground platform
                'normal'           // type
            );
            this.platforms.push(groundPlatform);
            this.log('生成起始平台');

            // Generate level platforms
            let lastX = 350;  // Start after ground platform
            let lastY = this.groundY - 50;  // Start slightly above ground
            let platformCount = 0;
            
            while (lastX < this.width - 400) {  // Leave space for flag
                // Generate platform gap
                const gap = Math.random() * (this.maxGap - this.minGap) + this.minGap;
                lastX += gap;

                // Generate platform width
                const width = Math.random() * (this.maxPlatformWidth - this.minPlatformWidth) + 
                            this.minPlatformWidth;

                // Calculate platform height with smoother transitions
                const maxYChange = 60;  // Reduced for smoother level
                let y = lastY + (Math.random() * maxYChange * 2 - maxYChange);
                y = Math.max(this.minY, Math.min(this.maxY, y));

                // Add normal platform
                const platform = new Platform(
                    lastX,
                    y,
                    width,
                    this.platformHeight,
                    'normal'
                );
                this.platforms.push(platform);
                platformCount++;

                // 20% chance to add hazard platform if not too early in level
                if (platformCount > 3 && Math.random() < 0.2) {
                    const hazardPlatform = new Platform(
                        lastX + width + 40,
                        y,
                        40,
                        this.platformHeight,
                        'hazard'
                    );
                    this.platforms.push(hazardPlatform);
                }

                // 10% chance to add long jump distance if not too early
                if (platformCount > 2 && Math.random() < 0.1) {
                    lastX += 150;  // Add extra gap for challenge
                }

                lastX += width;
                lastY = y;
            }

            // Add final platform for flag
            const finalPlatform = new Platform(
                this.width - 200,
                lastY,
                150,
                this.platformHeight,
                'normal'
            );
            this.platforms.push(finalPlatform);

            // Add finish flag
            this.flag = new Flag(
                this.width - 100,
                lastY - 64  // Flag height
            );

            this.log(`关卡生成完成 - 平台数量: ${this.platforms.length}`);
            
            // Log level details
            this.platforms.forEach((platform, index) => {
                if (Math.random() < 0.1) {  // Log only some platforms to avoid spam
                    this.log(`平台 ${index}: 位置(${Math.round(platform.x)}, ${Math.round(platform.y)}), ` +
                            `尺寸(${platform.width}, ${platform.height}), 类型:${platform.type}`);
                }
            });
        } catch (error) {
            this.log(`关卡生成错误: ${error.message}`);
            throw error;
        }
    }

    getPlatformAt(x, y) {
        return this.platforms.find(platform => {
            return x >= platform.x && 
                   x <= platform.x + platform.width &&
                   y >= platform.y &&
                   y <= platform.y + platform.height;
        });
    }

    getPlatformsInArea(x, y, width, height) {
        return this.platforms.filter(platform => {
            return !(platform.x + platform.width < x ||
                    platform.x > x + width ||
                    platform.y + platform.height < y ||
                    platform.y > y + height);
        });
    }

    getNextPlatform(currentX) {
        return this.platforms.find(platform => 
            platform.x > currentX && platform.type === 'normal'
        );
    }

    getNearestSafePlatform(x, y) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const platform of this.platforms) {
            if (platform.type === 'normal') {
                const dx = platform.x + platform.width/2 - x;
                const dy = platform.y - y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < minDist) {
                    minDist = dist;
                    nearest = platform;
                }
            }
        }
        
        return nearest;
    }

    isAtFlag(x, y) {
        return this.flag && 
               x >= this.flag.x && 
               x <= this.flag.x + this.flag.width &&
               y >= this.flag.y &&
               y <= this.flag.y + this.flag.height;
    }

    update(deltaTime) {
        // Update hazard platforms
        for (const platform of this.platforms) {
            if (platform.type === 'hazard' && platform.falling) {
                platform.update(deltaTime);
            }
        }

        // Remove fallen platforms
        this.platforms = this.platforms.filter(platform => 
            platform.type !== 'hazard' || platform.y < this.height + 100
        );

        // Update flag animation
        if (this.flag) {
            this.flag.update(deltaTime);
        }
    }

    triggerPlatformFall(platform) {
        if (platform && platform.type === 'hazard' && !platform.falling) {
            return platform.startFalling();
        }
        return false;
    }

    getState() {
        return {
            playerStart: { ...this.playerStart },
            platformCount: this.platforms.length,
            flagPosition: this.flag ? { x: this.flag.x, y: this.flag.y } : null
        };
    }
}

window.Level = Level;
