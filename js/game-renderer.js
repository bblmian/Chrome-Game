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

        // Base dimensions (original design size)
        this.baseWidth = 800;
        this.baseHeight = 400;
        this.scale = 1;

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

        // Calculate initial scale
        this.updateScale();
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    updateScale() {
        // Calculate scale based on canvas size
        const scaleX = this.canvas.width / this.baseWidth;
        const scaleY = this.canvas.height / this.baseHeight;
        this.scale = Math.min(scaleX, scaleY);
        this.log(`更新缩放比例: ${this.scale}`);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(gameState, background, camera, level, chicken, ui) {
        try {
            // Clear canvas
            this.clear();

            // Save the context state
            this.ctx.save();

            // Scale everything
            this.ctx.scale(this.scale, this.scale);

            // Center the game view
            const offsetX = (this.canvas.width / this.scale - this.baseWidth) / 2;
            const offsetY = (this.canvas.height / this.scale - this.baseHeight) / 2;
            this.ctx.translate(offsetX, offsetY);

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
                    ui.drawVolumeBar(this.ctx, this.scale);
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
                ui.drawMessage(this.ctx, message, this.baseWidth/2, this.baseHeight/2);
            }

            // Restore the context state
            this.ctx.restore();

            // Draw debug info (in screen space)
            if (this.showDebugInfo) {
                this.drawDebugInfo(gameState, chicken, camera);
            }

            // Draw watermark (in screen space)
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
                
                // 计算水印位置（右下角），考虑缩放
                const scaledWatermarkWidth = this.watermarkWidth * this.scale;
                const scaledWatermarkHeight = this.watermarkHeight * this.scale;
                const scaledPadding = this.watermarkPadding * this.scale;
                
                const x = this.canvas.width - scaledWatermarkWidth - scaledPadding;
                const y = this.canvas.height - scaledWatermarkHeight - scaledPadding;
                
                // 绘制水印
                this.ctx.drawImage(
                    this.watermark,
                    x, y,
                    scaledWatermarkWidth,
                    scaledWatermarkHeight
                );
                
            } catch (error) {
                this.log(`水印绘制错误: ${error.message}`);
            }
            
            this.ctx.restore();
        }
    }

    drawDebugInfo(gameState, chicken, camera) {
        if (!chicken) return;

        this.ctx.save();
        
        // Scale debug info
        const fontSize = 12 * this.scale;
        const padding = 10 * this.scale;
        const lineHeight = 15 * this.scale;
        const panelWidth = 250 * this.scale;
        const panelHeight = 90 * this.scale;
        
        // Draw debug panel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(padding, this.canvas.height - panelHeight - padding, panelWidth, panelHeight);
        
        // Draw debug text
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `State: ${gameState.getState()}`,
            `Chicken: (${Math.round(chicken.x)}, ${Math.round(chicken.y)})`,
            `Camera: (${Math.round(camera.x)}, ${Math.round(camera.y)})`,
            `Moving: ${chicken.isMoving}, Jumping: ${chicken.isJumping}`,
            `Velocity: (${Math.round(chicken.velocityX)}, ${Math.round(chicken.velocityY)})`
        ];

        debugInfo.forEach((text, index) => {
            this.ctx.fillText(
                text, 
                padding * 2, 
                this.canvas.height - panelHeight + (index + 1) * lineHeight
            );
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
        this.updateScale();
    }
}

window.GameRenderer = GameRenderer;
