class GameUI {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
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

        if (!this.ctx) {
            throw new Error('Failed to get canvas context');
        }
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

    drawVolumeBar() {
        const height = this.volumeBarHeight * this.volumeLevel;
        const radius = this.volumeBarRadius;

        // Draw background with border
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.roundRect(
            this.volumeBarX,
            this.volumeBarY,
            this.volumeBarWidth,
            this.volumeBarHeight,
            radius
        );
        this.ctx.fill();
        this.ctx.stroke();

        // Draw volume bar
        if (height > 0) {
            // Color gradient based on thresholds
            const gradient = this.ctx.createLinearGradient(
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
            
            this.ctx.fillStyle = gradient;
            this.roundRect(
                this.volumeBarX,
                this.volumeBarY + this.volumeBarHeight - height,
                this.volumeBarWidth,
                height,
                height < radius ? height / 2 : radius
            );
            this.ctx.fill();
        }

        // Draw pitch indicator
        if (this.pitchLevel > 0) {
            const pitchY = this.volumeBarY + this.volumeBarHeight * (1 - this.pitchLevel);
            this.ctx.fillStyle = this.pitchIndicatorColor;
            this.ctx.fillRect(
                this.volumeBarX - this.pitchIndicatorWidth,
                pitchY - 1,
                this.pitchIndicatorWidth,
                3
            );
        }

        // Draw threshold markers with labels
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.lineWidth = 1;
        
        // Move threshold
        const moveY = this.volumeBarY + this.volumeBarHeight * (1 - this.moveThreshold);
        this.ctx.beginPath();
        this.ctx.moveTo(this.volumeBarX, moveY);
        this.ctx.lineTo(this.volumeBarX + this.volumeBarWidth, moveY);
        this.ctx.stroke();
        this.ctx.fillText('移动', this.volumeBarX - 5, moveY + 4);
        
        // Jump threshold
        const jumpY = this.volumeBarY + this.volumeBarHeight * (1 - this.jumpThreshold);
        this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.volumeBarX, jumpY);
        this.ctx.lineTo(this.volumeBarX + this.volumeBarWidth, jumpY);
        this.ctx.stroke();
        this.ctx.fillText('跳跃', this.volumeBarX - 5, jumpY + 4);
    }

    drawStats(time, distance) {
        // Draw stats background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.roundRect(
            this.statsX,
            this.statsY,
            this.statsWidth,
            this.statsHeight,
            5
        );
        this.ctx.fill();
        this.ctx.stroke();

        // Draw text with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `时间: ${Math.floor(time)}秒`,
            this.statsX + 10,
            this.statsY + 20
        );
        this.ctx.fillText(
            `距离: ${Math.floor(distance)}米`,
            this.statsX + 10,
            this.statsY + 40
        );
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
    }

    drawMessage(text, x, y) {
        const lines = text.split('\n');
        
        // Draw message background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        const padding = 20;
        const lineHeight = 30;
        const width = 300;
        const height = lines.length * lineHeight + padding * 2;
        
        this.roundRect(
            x - width/2,
            y - height/2,
            width,
            height,
            10
        );
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw text with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        lines.forEach((line, index) => {
            this.ctx.fillText(
                line,
                x,
                y - (lines.length - 1) * lineHeight/2 + index * lineHeight
            );
        });
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}

window.GameUI = GameUI;
