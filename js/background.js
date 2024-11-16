class GameBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.video = null;
        this.debug = document.getElementById('debug');
        this.isInitialized = false;
        
        // Background settings
        this.overlayColor = 'rgba(255, 255, 255, 0.3)';  // Lighter overlay
        this.overlayGradient = null;
        this.createGradient();
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    createGradient() {
        // Create a gradient for better visibility of game objects
        this.overlayGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        this.overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');    // Lighter at top
        this.overlayGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');  // More transparent in middle
        this.overlayGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');    // Lighter at bottom
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

    draw() {
        if (!this.isInitialized || !this.video) return;

        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Save context state
            this.ctx.save();
            
            // Mirror the video horizontally for more intuitive interaction
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.canvas.width, 0);
            
            // Draw video frame
            this.ctx.drawImage(
                this.video,
                0, 0,
                this.canvas.width, this.canvas.height
            );
            
            // Restore context for normal drawing
            this.ctx.restore();
            
            // Add gradient overlay for better visibility
            this.ctx.fillStyle = this.overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Add vignette effect for better focus
            this.drawVignette();
            
        } catch (error) {
            this.log(`视频背景绘制错误: ${error.message}`);
            window.debugUtils?.updateVideoStatus('error');
        }
    }

    drawVignette() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width/1.5
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        this.createGradient();  // Recreate gradient for new dimensions
    }
}

window.GameBackground = GameBackground;
