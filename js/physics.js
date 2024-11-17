class Physics {
    constructor() {
        this.gravity = 980;  // 基准重力加速度
    }

    update(game) {
        const deltaTime = 1 / 60;  // 假设60fps
        const scaledGravity = this.gravity * game.scale;

        // 更新小鸡的物理状态
        const chicken = game.chicken;
        
        // 应用重力
        chicken.velocityY += scaledGravity * deltaTime;
        
        // 更新位置
        chicken.x += chicken.velocityX * deltaTime;
        chicken.y += chicken.velocityY * deltaTime;
        
        // 检查碰撞
        this.checkCollisions(game);
    }

    checkCollisions(game) {
        const chicken = game.chicken;
        let onPlatform = false;

        // 检查与平台的碰撞
        game.platforms.forEach(platform => {
            if (this.checkCollision(chicken, platform)) {
                // 从上方碰撞
                if (chicken.velocityY > 0 && 
                    chicken.y + chicken.height - chicken.velocityY <= platform.y) {
                    chicken.y = platform.y - chicken.height;
                    chicken.velocityY = 0;
                    chicken.isJumping = false;
                    onPlatform = true;
                }
                // 从下方碰撞
                else if (chicken.velocityY < 0 && 
                         chicken.y >= platform.y + platform.height) {
                    chicken.y = platform.y + platform.height;
                    chicken.velocityY = 0;
                }
                // 从左侧碰撞
                else if (chicken.velocityX > 0 && 
                         chicken.x + chicken.width - chicken.velocityX <= platform.x) {
                    chicken.x = platform.x - chicken.width;
                    chicken.velocityX = 0;
                }
                // 从右侧碰撞
                else if (chicken.velocityX < 0 && 
                         chicken.x >= platform.x + platform.width) {
                    chicken.x = platform.x + platform.width;
                    chicken.velocityX = 0;
                }
            }
        });

        // 如果不在任何平台上且不在跳跃中
        if (!onPlatform && !chicken.isJumping) {
            chicken.isJumping = true;
        }

        // 防止超出画布边界
        if (chicken.x < 0) {
            chicken.x = 0;
            chicken.velocityX = 0;
        }
        if (chicken.x + chicken.width > game.canvas.width) {
            chicken.x = game.canvas.width - chicken.width;
            chicken.velocityX = 0;
        }
        if (chicken.y < 0) {
            chicken.y = 0;
            chicken.velocityY = 0;
        }
        if (chicken.y + chicken.height > game.canvas.height) {
            chicken.y = game.canvas.height - chicken.height;
            chicken.velocityY = 0;
            chicken.isJumping = false;
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
}
