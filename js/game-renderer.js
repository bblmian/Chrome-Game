class GameRenderer {
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas is required for GameRenderer');
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get canvas context');
        }
        this.debug = document.getElementById('debug');
        
        // Debug flags
        this.showColliders = false;
        this.showDebugInfo = false;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(gameState, background, camera, level, chicken, ui) {
        try {
            // Clear canvas
            this.clear();

            // Draw video background
            background.draw();

            // Draw game world if in MENU or PLAYING state
            if (gameState.isState('MENU') || gameState.isState('PLAYING')) {
                // Apply camera transform
                this.ctx.save();
                camera.applyTransform(this.ctx);

                // Draw platforms
                if (level && level.platforms) {
                    level.platforms.forEach(platform => {
                        if (camera.isInView(platform)) {
                            platform.draw(this.ctx);
                            
                            // Draw colliders in debug mode
                            if (this.showColliders) {
                                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                                this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                            }
                        }
                    });
                }

                // Draw flag
                if (level && level.flag && camera.isInView(level.flag)) {
                    level.flag.draw(this.ctx);
                }

                // Draw chicken
                if (chicken) {
                    chicken.draw(this.ctx);
                    
                    // Draw collider in debug mode
                    if (this.showColliders) {
                        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                        this.ctx.strokeRect(chicken.x, chicken.y, chicken.width, chicken.height);
                    }
                }

                this.ctx.restore();

                // Draw UI elements
                ui.drawVolumeBar();
                if (gameState.isState('PLAYING')) {
                    ui.drawStats(gameState.gameTime, gameState.gameDistance);
                }
            }

            // Draw messages based on game state
            if (!gameState.isState('PLAYING')) {
                const message = gameState.isState('MENU') ?
                    '点击开始游戏！\n用声音控制小鸡移动和跳跃' :
                    gameState.isState('WIN') ?
                        '恭喜过关！\n点击重新开始' :
                        '游戏结束\n点击重新开始';
                ui.drawMessage(message, this.canvas.width/2, this.canvas.height/2);
            }

            // Draw debug info
            if (this.showDebugInfo) {
                this.drawDebugInfo(gameState, chicken, camera);
            }

        } catch (error) {
            this.log(`渲染错误: ${error.message}`);
            console.error('Render error:', error);
        }
    }

    drawDebugInfo(gameState, chicken, camera) {
        this.ctx.save();
        
        // Draw debug panel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 100, 250, 90);
        
        // Draw debug text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `State: ${gameState.getState()}`,
            `Chicken: (${Math.round(chicken.x)}, ${Math.round(chicken.y)})`,
            `Camera: (${Math.round(camera.x)}, ${Math.round(camera.y)})`,
            `Moving: ${chicken.isMoving}, Jumping: ${chicken.isJumping}`,
            `Velocity: (${Math.round(chicken.velocityX)}, ${Math.round(chicken.velocityY)})`
        ];

        debugInfo.forEach((text, index) => {
            this.ctx.fillText(text, 20, this.canvas.height - 80 + index * 15);
        });

        this.ctx.restore();
    }

    toggleDebugMode() {
        this.showColliders = !this.showColliders;
        this.showDebugInfo = !this.showDebugInfo;
        this.log(`调试模式: ${this.showDebugInfo ? '开启' : '关闭'}`);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

window.GameRenderer = GameRenderer;
