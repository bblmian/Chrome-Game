class GameRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        
        // 加载图片资源
        this.chickenImage = new Image();
        this.chickenImage.src = 'assets/chicken_2.png';
        
        this.bannerImage = new Image();
        this.bannerImage.src = 'assets/banner.png';
    }

    render() {
        // 保存当前上下文状态
        this.ctx.save();
        
        // 应用相机变换
        this.ctx.translate(-this.game.camera.x, 0);
        
        // 绘制背景（如果有的话）
        if (this.game.background) {
            this.game.background.render();
        }
        
        // 绘制平台
        this.renderPlatforms();
        
        // 绘制小鸡
        this.renderChicken();
        
        // 恢复上下文状态
        this.ctx.restore();
        
        // 绘制UI（不受相机影响）
        this.renderUI();
    }

    renderPlatforms() {
        // 获取可见区域
        const viewportLeft = this.game.camera.x;
        const viewportRight = viewportLeft + this.game.canvas.width;
        
        // 只渲染可见的平台
        this.game.platforms.forEach(platform => {
            if (platform.x + platform.width >= viewportLeft && 
                platform.x <= viewportRight) {
                // 使用图片渲染平台
                this.ctx.drawImage(
                    this.bannerImage,
                    platform.x,
                    platform.y,
                    platform.width,
                    platform.height
                );
            }
        });
    }

    renderChicken() {
        const chicken = this.game.chicken;
        
        // 使用图片渲染小鸡
        this.ctx.drawImage(
            this.chickenImage,
            chicken.x,
            chicken.y,
            chicken.width,
            chicken.height
        );
    }

    renderUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${20 * this.game.scale}px Arial`;
        
        // 渲染得分
        const score = Math.floor(this.game.chicken.x / 100);
        this.ctx.fillText(`得分: ${score}`, 20, 30 * this.game.scale);
        
        // 如果游戏未开始，显示开始提示
        if (!this.game.isRunning) {
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                '点击或触摸屏幕开始游戏',
                this.game.canvas.width / 2,
                this.game.canvas.height / 2
            );
            this.ctx.textAlign = 'left';  // 恢复默认对齐
        }
    }

    // 用于在游戏结束时显示结果
    showGameOver(score) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = `${30 * this.game.scale}px Arial`;
        
        this.ctx.fillText(
            '游戏结束',
            this.game.canvas.width / 2,
            this.game.canvas.height / 2 - 40 * this.game.scale
        );
        
        this.ctx.fillText(
            `得分: ${score}`,
            this.game.canvas.width / 2,
            this.game.canvas.height / 2
        );
        
        this.ctx.fillText(
            '点击或触摸屏幕重新开始',
            this.game.canvas.width / 2,
            this.game.canvas.height / 2 + 40 * this.game.scale
        );
        
        this.ctx.textAlign = 'left';  // 恢复默认对齐
    }
}
