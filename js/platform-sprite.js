class Platform extends Sprite {
    constructor(x, y, width, height, type = 'normal') {
        super(x, y, width, height);
        this.type = type;
        this.fallDelay = 500;  // Delay before hazard platform falls
        this.falling = false;
        
        // Visual properties
        this.glowAmount = 0;
        this.glowDirection = 1;
        this.glowSpeed = 0.05;
        this.borderWidth = 2;
    }

    startFalling() {
        if (this.type === 'hazard' && !this.falling) {
            this.falling = true;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update glow animation
        this.glowAmount += this.glowSpeed * this.glowDirection;
        if (this.glowAmount >= 1) {
            this.glowAmount = 1;
            this.glowDirection = -1;
        } else if (this.glowAmount <= 0) {
            this.glowAmount = 0;
            this.glowDirection = 1;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Platform shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        // Draw platform based on type
        if (this.type === 'normal') {
            // Normal platform gradient
            const gradient = ctx.createLinearGradient(
                this.x, this.y,
                this.x, this.y + this.height
            );
            gradient.addColorStop(0, '#4CAF50');  // Lighter green
            gradient.addColorStop(1, '#388E3C');  // Darker green
            ctx.fillStyle = gradient;
        } else if (this.type === 'hazard') {
            // Hazard platform gradient with glow effect
            const gradient = ctx.createLinearGradient(
                this.x, this.y,
                this.x, this.y + this.height
            );
            gradient.addColorStop(0, `rgba(255, ${87 + this.glowAmount * 50}, 34, 0.9)`);  // Glowing red
            gradient.addColorStop(1, '#D32F2F');  // Dark red
            ctx.fillStyle = gradient;
        }

        // Draw platform body with rounded corners
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
        ctx.fill();

        // Platform border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = this.borderWidth;
        ctx.stroke();

        // Add texture/pattern
        if (this.type === 'normal') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i, this.y + this.height);
                ctx.stroke();
            }
        } else if (this.type === 'hazard') {
            // Warning stripes for hazard platforms
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            const stripeWidth = 10;
            for (let i = 0; i < this.width; i += stripeWidth * 2) {
                ctx.fillRect(this.x + i, this.y, stripeWidth, this.height);
            }
        }

        ctx.restore();
    }
}

class Flag extends Sprite {
    constructor(x, y) {
        super(x, y, 32, 64);  // Standard flag size
        
        // Animation properties
        this.waveSpeed = 5;
        this.waveAmplitude = 10;
        this.time = 0;
        
        // Visual properties
        this.poleColor = '#8B4513';     // Brown pole
        this.flagColor = '#FFD700';      // Gold flag
        this.borderWidth = 2;
    }

    update(deltaTime) {
        this.time += deltaTime * this.waveSpeed;
    }

    draw(ctx) {
        ctx.save();
        
        // Add shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;

        // Draw pole
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + 4, this.y);
        gradient.addColorStop(0, '#8B4513');  // Brown
        gradient.addColorStop(1, '#A0522D');  // Lighter brown
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, 4, this.height);
        
        // Draw waving flag
        ctx.beginPath();
        ctx.moveTo(this.x + 4, this.y + 4);
        
        // Create wave effect
        for (let i = 0; i <= this.width; i++) {
            const waveOffset = Math.sin(this.time + i * 0.3) * this.waveAmplitude;
            ctx.lineTo(this.x + 4 + i, this.y + 4 + waveOffset);
        }
        
        for (let i = this.width; i >= 0; i--) {
            const waveOffset = Math.sin(this.time + i * 0.3) * this.waveAmplitude;
            ctx.lineTo(this.x + 4 + i, this.y + 24 + waveOffset);
        }
        
        ctx.closePath();
        
        // Fill flag with gradient
        const flagGradient = ctx.createLinearGradient(
            this.x + 4, this.y,
            this.x + 4, this.y + 24
        );
        flagGradient.addColorStop(0, '#FFD700');  // Gold
        flagGradient.addColorStop(1, '#FFC000');  // Darker gold
        ctx.fillStyle = flagGradient;
        ctx.fill();
        
        // Add flag border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = this.borderWidth;
        ctx.stroke();
        
        // Add shine effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 4, this.y + 8);
        for (let i = 0; i <= this.width; i++) {
            const waveOffset = Math.sin(this.time + i * 0.3) * this.waveAmplitude;
            ctx.lineTo(this.x + 4 + i, this.y + 8 + waveOffset);
        }
        ctx.stroke();
        
        ctx.restore();
    }
}

window.Platform = Platform;
window.Flag = Flag;
