class GameUI {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Base dimensions (original design size)
        this.baseWidth = 800;
        this.baseHeight = 400;
        
        // Volume meter properties
        this.volumeBarHeight = 150;
        this.volumeBarWidth = 30;
        this.volumeBarX = 20;
        this.volumeBarY = 20;
        this.volumeLevel = 0;
        this.volumeBarRadius = 5;
        this.targetVolumeLevel = 0;
        
        // Pitch indicator properties
        this.pitchLevel = 0;
        this.targetPitchLevel = 0;
        this.pitchIndicatorWidth = 5;
        this.pitchIndicatorColor = '#FFA500';  // Orange for pitch
        
        // Stats display properties
        this.statsX = this.volumeBarX + this.volumeBarWidth + 20;
        this.statsY = 20;
        this.statsWidth = 150;
        this.statsHeight = 50;
        
        // Animation properties
        this.volumeAnimationSpeed = 0.3;  // Faster volume response
        this.pitchAnimationSpeed = 0.25;  // Smooth pitch indicator
        
        // Threshold indicators
        this.moveThreshold = 0.15;
        this.jumpThreshold = 0.2;
    }

    update() {
        // Smooth animation transitions
        this.volumeLevel += (this.targetVolumeLevel - this.volumeLevel) * this.volumeAnimationSpeed;
        this.pitchLevel += (this.targetPitchLevel - this.pitchLevel) * this.pitchAnimationSpeed;
    }

    setVolume(volume) {
        this.targetVolumeLevel = volume;
    }

    setPitch(pitch) {
        this.targetPitchLevel = pitch;
    }

    drawVolumeBar(ctx, scale = 1) {
        const height = this.volumeBarHeight * this.volumeLevel;
        const radius = this.volumeBarRadius;

        // Draw background with border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        this.roundRect(ctx,
            this.volumeBarX,
            this.volumeBarY,
            this.volumeBarWidth,
            this.volumeBarHeight,
            radius
        );
        ctx.fill();
        ctx.stroke();

        // Draw volume bar
        if (height > 0) {
            // Color gradient based on thresholds
            const gradient = ctx.createLinearGradient(
                this.volumeBarX,
                this.volumeBarY + this.volumeBarHeight - height,
                this.volumeBarX,
                this.volumeBarY + this.volumeBarHeight
            );
            
            if (this.volumeLevel > this.jumpThreshold) {
                gradient.addColorStop(0, '#FFA500');  // Orange
                gradient.addColorStop(1, '#FF8C00');  // Dark Orange
            } else if (this.volumeLevel > this.moveThreshold) {
                gradient.addColorStop(0, '#4CAF50');  // Green
                gradient.addColorStop(1, '#45A049');  // Dark Green
            } else {
                gradient.addColorStop(0, '#9E9E9E');  // Gray
                gradient.addColorStop(1, '#757575');  // Dark Gray
            }
            
            ctx.fillStyle = gradient;
            this.roundRect(ctx,
                this.volumeBarX,
                this.volumeBarY + this.volumeBarHeight - height,
                this.volumeBarWidth,
                height,
                height < radius ? height / 2 : radius
            );
            ctx.fill();
        }

        // Draw pitch indicator
        if (this.pitchLevel > 0) {
            const pitchY = this.volumeBarY + this.volumeBarHeight * (1 - this.pitchLevel);
            ctx.fillStyle = this.pitchIndicatorColor;
            ctx.fillRect(
                this.volumeBarX - this.pitchIndicatorWidth,
                pitchY - 1,
                this.pitchIndicatorWidth,
                3
            );
        }

        // Draw threshold markers with labels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${10}px Arial`;
        ctx.textAlign = 'right';
        ctx.lineWidth = 1;
        
        // Move threshold
        const moveY = this.volumeBarY + this.volumeBarHeight * (1 - this.moveThreshold);
        ctx.beginPath();
        ctx.moveTo(this.volumeBarX, moveY);
        ctx.lineTo(this.volumeBarX + this.volumeBarWidth, moveY);
        ctx.stroke();
        ctx.fillText('移动', this.volumeBarX - 5, moveY + 4);
        
        // Jump threshold
        const jumpY = this.volumeBarY + this.volumeBarHeight * (1 - this.jumpThreshold);
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(this.volumeBarX, jumpY);
        ctx.lineTo(this.volumeBarX + this.volumeBarWidth, jumpY);
        ctx.stroke();
        ctx.fillText('跳跃', this.volumeBarX - 5, jumpY + 4);
    }

    drawStats(ctx, time, distance) {
        // Draw stats background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx,
            this.statsX,
            this.statsY,
            this.statsWidth,
            this.statsHeight,
            5
        );
        ctx.fill();
        ctx.stroke();

        // Draw text with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = 'white';
        ctx.font = `${14}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(
            `时间: ${Math.floor(time)}秒`,
            this.statsX + 10,
            this.statsY + 20
        );
        ctx.fillText(
            `距离: ${Math.floor(distance)}米`,
            this.statsX + 10,
            this.statsY + 40
        );
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
    }

    drawMessage(ctx, text, x, y) {
        const lines = text.split('\n');
        
        // Draw message background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        const padding = 20;
        const lineHeight = 30;
        const width = 300;
        const height = lines.length * lineHeight + padding * 2;
        
        this.roundRect(ctx,
            x - width/2,
            y - height/2,
            width,
            height,
            10
        );
        ctx.fill();
        ctx.stroke();
        
        // Draw text with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${16}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        lines.forEach((line, index) => {
            ctx.fillText(
                line,
                x,
                y - (lines.length - 1) * lineHeight/2 + index * lineHeight
            );
        });
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

window.GameUI = GameUI;
