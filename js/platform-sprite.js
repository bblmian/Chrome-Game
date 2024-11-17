class Platform extends Sprite {
    constructor(x, y, width, height, type = 'normal') {
        super(x, y, width, height);
        this.type = type;
        this.isFalling = false;
        this.fallSpeed = 0;
        this.fallAcceleration = 1000;
        this.warningStartTime = 0;
        this.warningDuration = 2000; // 2秒警告时间
        this.originalY = y;  // 保存原始Y位置
        
        // Visual properties
        this.glowAmount = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.05;
        this.borderWidth = 2;
        
        // Colors
        this.colors = {
            normal: {
                fill: ['#44AA44', '#3D993D', '#367F36'],  // 渐变色
                border: '#226622',
                pattern: '#3D993D'
            },
            hazard: {
                fill: ['#FF4444', '#DD3939', '#CC2F2F'],  // 渐变色
                border: '#882222',
                warning: '#FF8800',  // 警告颜色
                pattern: '#DD3939'
            }
        };
    }

    startFalling() {
        if (!this.isFalling) {
            this.isFalling = true;
            this.fallSpeed = 0;
        }
    }

    update(deltaTime) {
        // Update glow animation
        this.glowAmount += this.glowSpeed * this.glowDirection;
        if (this.glowAmount >= 1) {
            this.glowAmount = 1;
            this.glowDirection = -1;
        } else if (this.glowAmount <= 0) {
            this.glowAmount = 0;
            this.glowDirection = 1;
        }

        // Update falling
        if (this.isFalling) {
            this.fallSpeed += this.fallAcceleration * deltaTime;
            this.y += this.fallSpeed * deltaTime;
        }
    }

    draw(ctx) {
        ctx.save();
        
        try {
            // 选择颜色
            const colorSet = this.colors[this.type];
            let fillColors = colorSet.fill;
            
            // 如果是危险平台且在警告状态，使用警告颜色
            if (this.type === 'hazard' && this.warningStartTime > 0) {
                const elapsedTime = Date.now() - this.warningStartTime;
                if (elapsedTime < this.warningDuration) {
                    const warningRatio = (Math.sin(elapsedTime * 0.01) + 1) / 2;
                    fillColors = fillColors.map(color => 
                        this.interpolateColor(color, colorSet.warning, warningRatio)
                    );
                }
            }
            
            // 创建渐变
            const gradient = ctx.createLinearGradient(
                this.x, this.y,
                this.x, this.y + this.height
            );
            gradient.addColorStop(0, fillColors[0]);
            gradient.addColorStop(0.5, fillColors[1]);
            gradient.addColorStop(1, fillColors[2]);
            
            // 绘制平台主体
            ctx.fillStyle = gradient;
            ctx.strokeStyle = colorSet.border;
            ctx.lineWidth = this.borderWidth;
            
            // 绘制圆角矩形
            const radius = 5;
            ctx.beginPath();
            ctx.moveTo(this.x + radius, this.y);
            ctx.lineTo(this.x + this.width - radius, this.y);
            ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
            ctx.lineTo(this.x + this.width, this.y + this.height - radius);
            ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
            ctx.lineTo(this.x + radius, this.y + this.height);
            ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
            ctx.lineTo(this.x, this.y + radius);
            ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
            ctx.closePath();
            
            // 填充和描边
            ctx.fill();
            ctx.stroke();
            
            // 添加纹理图案
            ctx.fillStyle = colorSet.pattern;
            ctx.globalAlpha = 0.1;
            
            // 绘制斜线纹理
            const lineSpacing = 10;
            const lineWidth = 2;
            ctx.beginPath();
            for (let x = this.x - this.height; x < this.x + this.width + this.height; x += lineSpacing) {
                ctx.moveTo(x, this.y);
                ctx.lineTo(x + this.height, this.y + this.height);
            }
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = colorSet.pattern;
            ctx.stroke();
            
            // 如果是危险平台且在警告状态，添加警告效果
            if (this.type === 'hazard' && this.warningStartTime > 0) {
                const elapsedTime = Date.now() - this.warningStartTime;
                if (elapsedTime < this.warningDuration) {
                    // 添加警告光晕
                    const warningGradient = ctx.createRadialGradient(
                        this.x + this.width/2, this.y + this.height/2, 0,
                        this.x + this.width/2, this.y + this.height/2, this.width/2
                    );
                    warningGradient.addColorStop(0, 'rgba(255, 136, 0, 0.2)');
                    warningGradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
                    ctx.globalAlpha = Math.sin(elapsedTime * 0.01) * 0.5 + 0.5;
                    ctx.fillStyle = warningGradient;
                    ctx.fillRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);
                }
            }
            
        } catch (error) {
            console.error('Platform drawing error:', error);
        }
        
        ctx.restore();
    }

    setWarning() {
        if (this.type === 'hazard' && this.warningStartTime === 0) {
            this.warningStartTime = Date.now();
        }
    }

    interpolateColor(color1, color2, ratio) {
        // 将颜色转换为RGB
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        // 在两个颜色之间插值
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    reset() {
        this.y = this.originalY;
        this.isFalling = false;
        this.fallSpeed = 0;
        this.warningStartTime = 0;
    }
}

window.Platform = Platform;
