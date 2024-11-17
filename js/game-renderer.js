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

        // 加载水印图片
        this.watermark = new Image();
        this.watermark.src = 'assets/banner.png';
        this.watermarkLoaded = false;
        this.watermark.onload = () => {
            this.watermarkLoaded = true;
            // 根据原始图片比例计算水印尺寸，高度为80（原来的2倍）
            const ratio = this.watermark.width / this.watermark.height;
            this.watermarkHeight = 80;  // 增加到原来的2倍
            this.watermarkWidth = this.watermarkHeight * ratio;
            this.log('水印图片加载成功');
        };
        this.watermark.onerror = (error) => {
            this.log(`水印图片加载失败: ${error}`);
        };

        // 水印设置
        this.watermarkPadding = 20; // 增加边距
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
            background.draw(this.ctx);

            // Draw game world if in MENU or PLAYING state
            if (gameState.isState('MENU') || gameState.isState('PLAYING')) {
                // Apply camera transform
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

                // Restore camera transform
                camera.restoreTransform(this.ctx);

                // Draw UI elements
                if (ui) {
                    ui.drawVolumeBar(this.ctx);
                    if (gameState.isState('PLAYING')) {
                        ui.drawStats(this.ctx, gameState.gameTime, gameState.gameDistance);
                    }
                }
            }

            // Draw messages based on game state
            if (!gameState.isState('PLAYING') && ui) {
                const message = gameState.isState('MENU') ?
                    '点击开始游戏！\n用声音控制小鸡移动和跳跃' :
                    gameState.isState('WIN') ?
                        '恭喜过关！\n点击重新开始' :
                        '游戏结束\n点击重新开始';
                ui.drawMessage(this.ctx, message, this.canvas.width/2, this.canvas.height/2);
            }

            // Draw debug info
            if (this.showDebugInfo) {
                this.drawDebugInfo(gameState, chicken, camera);
            }

            // Draw watermark
            this.drawWatermark();

        } catch (error) {
            this.log(`渲染错误: ${error.message}`);
            console.error('Render error:', error);
            
            // Try to show error message
            try {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = 'red';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('渲染错误', 10, 30);
            } catch (e) {
                console.error('Failed to show error message:', e);
            }
        }
    }

    drawWatermark() {
        if (this.watermarkLoaded) {
            this.ctx.save();
            
            try {
                // 设置水印透明度
                this.ctx.globalAlpha = 0.7;
                
                // 计算水印位置（右下角）
                const x = this.canvas.width - this.watermarkWidth - this.watermarkPadding;
                const y = this.canvas.height - this.watermarkHeight - this.watermarkPadding;
                
                // 绘制水印
                this.ctx.drawImage(
                    this.watermark,
                    x, y,
                    this.watermarkWidth,
                    this.watermarkHeight
                );
                
                // Debug: 记录水印位置
                if (Math.random() < 0.01) {  // 偶尔记录一下
                    this.log(`水印位置: (${x}, ${y}), 尺寸: ${this.watermarkWidth}x${this.watermarkHeight}`);
                }
            } catch (error) {
                this.log(`水印绘制错误: ${error.message}`);
            }
            
            this.ctx.restore();
        } else {
            // Debug: 记录水印未加载
            if (Math.random() < 0.01) {  // 偶尔记录一下
                this.log('水印图片未加载完成');
            }
        }
    }

    drawDebugInfo(gameState, chicken, camera) {
        if (!chicken) return;

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
