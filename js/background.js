class GameBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.video = null;
        this.debug = document.getElementById('debug');
        this.isInitialized = false;
        
        // Background settings
        this.overlayColor = 'rgba(255, 255, 255, 0.3)';  // Lighter overlay
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    createGradient(ctx) {
        // Create a gradient for better visibility of game objects
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');    // Lighter at top
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');  // More transparent in middle
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');    // Lighter at bottom
        return gradient;
    }

    async initialize() {
        try {
            // Create video element
            this.video = document.createElement('video');
            this.video.style.display = 'none';
            this.video.autoplay = true;
            this.video.playsInline = true;
            document.body.appendChild(this.video);

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: this.canvas.width,
                    height: this.canvas.height,
                    facingMode: 'user'  // Use front camera
                }
            });

            // Set up video stream
            this.video.srcObject = stream;
            await this.video.play();

            this.isInitialized = true;
            this.log('视频背景初始化成功');

            // Log video dimensions
            const settings = stream.getVideoTracks()[0].getSettings();
            this.log(`视频分辨率: ${settings.width}x${settings.height}`);
            window.debugUtils?.updateVideoStatus('active', settings);

        } catch (error) {
            this.log(`视频背景初始化错误: ${error.message}`);
            window.debugUtils?.updateVideoStatus('error');
            throw error;
        }
    }

    draw(ctx) {
        if (!this.isInitialized || !this.video) return;

        try {
            // Save context state
            ctx.save();
            
            // Mirror the video horizontally for more intuitive interaction
            ctx.scale(-1, 1);
            ctx.translate(-this.canvas.width, 0);
            
            // Draw video frame
            ctx.drawImage(
                this.video,
                0, 0,
                this.canvas.width, this.canvas.height
            );
            
            // Restore context for normal drawing
            ctx.restore();
            
            // Add gradient overlay for better visibility
            ctx.fillStyle = this.createGradient(ctx);
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Add vignette effect for better focus
            this.drawVignette(ctx);
            
        } catch (error) {
            this.log(`视频背景绘制错误: ${error.message}`);
            window.debugUtils?.updateVideoStatus('error');
        }
    }

    drawVignette(ctx) {
        const gradient = ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width/1.5
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    cleanup() {
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
            window.debugUtils?.updateVideoStatus('inactive');
        }
        if (this.video && this.video.parentNode) {
            this.video.parentNode.removeChild(this.video);
        }
        this.video = null;
        this.isInitialized = false;
        this.log('视频背景已清理');
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

window.GameBackground = GameBackground;
