class UI {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
        
        // UI配置
        this.config = {
            fontSize: {
                small: 16,
                medium: 24,
                large: 32
            },
            colors: {
                text: '#FFFFFF',
                shadow: 'rgba(0, 0, 0, 0.5)',
                overlay: 'rgba(0, 0, 0, 0.7)',
                success: '#4CAF50',
                error: '#F44336'
            },
            padding: 20
        };

        // 缓存常用值
        this.updateDimensions();
    }

    updateDimensions() {
        // 根据屏幕大小调整字体
        const scale = Math.min(this.canvas.width / 800, this.canvas.height / 600);
        this.fontSize = {
            small: Math.round(this.config.fontSize.small * scale),
            medium: Math.round(this.config.fontSize.medium * scale),
            large: Math.round(this.config.fontSize.large * scale)
        };
        this.padding = Math.round(this.config.padding * scale);
    }

    render() {
        if (this.game.state === 'playing') {
            this.renderGameUI();
        } else if (this.game.state === 'ready') {
            this.renderStartScreen();
        } else if (this.game.state === 'gameover') {
            this.renderGameOver();
        }
    }

    renderGameUI() {
        // 设置文本样式
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // 绘制分数
        this.setTextStyle(this.fontSize.medium, this.config.colors.text);
        const score = Math.floor(this.game.chicken.x / 100);
        this.drawText(`得分: ${score}`, this.padding, this.padding);

        // 绘制音量指示器（如果使用音频控制）
        if (this.game.audioController && this.game.audioController.isInitialized) {
            this.renderVolumeIndicator();
        }
    }

    renderVolumeIndicator() {
        const width = 30;
        const height = 150;
        const x = this.canvas.width - width - this.padding;
        const y = this.padding;

        // 绘制背景
        this.ctx.fillStyle = this.config.colors.shadow;
        this.ctx.fillRect(x, y, width, height);

        // 绘制音量条
        const volume = this.game.audioController.volumeLevel;
        const volumeHeight = height * volume;
        this.ctx.fillStyle = this.config.colors.success;
        this.ctx.fillRect(x, y + height - volumeHeight, width, volumeHeight);
    }

    renderStartScreen() {
        // 绘制半透明背景
        this.ctx.fillStyle = this.config.colors.overlay;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制标题
        this.setTextStyle(this.fontSize.large, this.config.colors.text, 'center');
        this.drawText('小鸡闯关', this.canvas.width / 2, this.canvas.height / 3);

        // 绘制说明文字
        this.setTextStyle(this.fontSize.medium, this.config.colors.text, 'center');
        if (this.game.audioController && this.game.audioController.isInitialized) {
            this.drawText('发出声音移动 - 音量控制速度', 
                this.canvas.width / 2, 
                this.canvas.height / 2);
            this.drawText('发出高音跳跃 - 音调控制高度', 
                this.canvas.width / 2, 
                this.canvas.height / 2 + this.fontSize.medium * 1.5);
        } else {
            this.drawText('左右滑动移动 - 点击跳跃', 
                this.canvas.width / 2, 
                this.canvas.height / 2);
        }

        // 绘制开始提示
        this.setTextStyle(this.fontSize.medium, this.config.colors.success, 'center');
        this.drawText('点击或触摸屏幕开始游戏', 
            this.canvas.width / 2, 
            this.canvas.height * 2/3);
    }

    renderGameOver() {
        // 绘制半透明背景
        this.ctx.fillStyle = this.config.colors.overlay;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制游戏结束文字
        this.setTextStyle(this.fontSize.large, this.config.colors.error, 'center');
        this.drawText('游戏结束', 
            this.canvas.width / 2, 
            this.canvas.height / 3);

        // 绘制得分
        const score = Math.floor(this.game.chicken.x / 100);
        this.setTextStyle(this.fontSize.medium, this.config.colors.text, 'center');
        this.drawText(`最终得分: ${score}`, 
            this.canvas.width / 2, 
            this.canvas.height / 2);

        // 绘制重新开始提示
        this.setTextStyle(this.fontSize.medium, this.config.colors.success, 'center');
        this.drawText('点击或触摸屏幕重新开始', 
            this.canvas.width / 2, 
            this.canvas.height * 2/3);
    }

    setTextStyle(size, color, align = 'left') {
        this.ctx.font = `${size}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
    }

    drawText(text, x, y) {
        // 绘制文字阴影
        this.ctx.fillStyle = this.config.colors.shadow;
        this.ctx.fillText(text, x + 2, y + 2);
        
        // 绘制文字
        this.ctx.fillStyle = this.config.colors.text;
        this.ctx.fillText(text, x, y);
    }

    // 当窗口大小改变时调用
    handleResize() {
        this.updateDimensions();
    }
}
