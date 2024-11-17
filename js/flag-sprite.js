class Flag extends Sprite {
    constructor(x, y) {
        const width = 30;
        const height = 40;
        super(x, y, width, height);
        
        // Flag colors
        this.poleColor = '#888888';
        this.flagColor = '#FF4444';
        
        // Flag animation
        this.waveAmount = 0;
        this.waveSpeed = 5;
        this.waveTime = 0;
    }

    update(deltaTime) {
        // Update flag wave animation
        this.waveTime += deltaTime * this.waveSpeed;
        this.waveAmount = Math.sin(this.waveTime) * 5;
    }

    draw(ctx) {
        ctx.save();
        
        try {
            // Draw pole
            ctx.fillStyle = this.poleColor;
            ctx.fillRect(
                this.x + this.width/2 - 2,
                this.y,
                4,
                this.height
            );
            
            // Draw flag
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + 5);
            
            // Create wave effect
            for (let i = 0; i <= this.width/2; i++) {
                const waveOffset = Math.sin((i/this.width) * Math.PI * 2 + this.waveTime) * this.waveAmount;
                ctx.lineTo(
                    this.x + this.width/2 + i,
                    this.y + 5 + waveOffset
                );
            }
            
            for (let i = this.width/2; i >= 0; i--) {
                const waveOffset = Math.sin((i/this.width) * Math.PI * 2 + this.waveTime) * this.waveAmount;
                ctx.lineTo(
                    this.x + this.width/2 + i,
                    this.y + 20 + waveOffset
                );
            }
            
            ctx.closePath();
            
            // Fill flag
            ctx.fillStyle = this.flagColor;
            ctx.fill();
            
            // Add flag border
            ctx.strokeStyle = '#AA3333';
            ctx.lineWidth = 1;
            ctx.stroke();
            
        } catch (error) {
            console.error('Flag drawing error:', error);
        }
        
        ctx.restore();
    }
}

window.Flag = Flag;
