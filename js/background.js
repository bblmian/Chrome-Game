class Background {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
        
        // 背景配置
        this.config = {
            oceanHeight: 100,  // 海洋高度
            skyColor: '#87CEEB',  // 天空颜色
            oceanColor: '#4169E1',  // 海洋颜色
            cloudColor: 'rgba(255, 255, 255, 0.8)',  // 云朵颜色
            parallaxSpeed: 0.5  // 视差速度
        };

        // 云朵数组
        this.clouds = [];
        this.initClouds();

        // 视频元素
        this.video = document.getElementById('camera');
        this.hasVideoBackground = false;

        // 尝试初始化摄像头
        this.initCamera();
    }

    async initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: this.canvas.width },
                    height: { ideal: this.canvas.height }
                }
            });
            
            this.video.srcObject = stream;
            this.video.play();
            this.hasVideoBackground = true;
            
            // 处理视频加载完成
            this.video.onloadedmetadata = () => {
                // 调整视频尺寸以填充画布
                this.updateVideoSize();
            };
        } catch (error) {
            console.log('Camera not available:', error);
            this.hasVideoBackground = false;
        }
    }

    updateVideoSize() {
        if (!this.hasVideoBackground) return;

        const videoAspect = this.video.videoWidth / this.video.videoHeight;
        const canvasAspect = this.canvas.width / this.canvas.height;

        if (videoAspect > canvasAspect) {
            this.videoHeight = this.canvas.height;
            this.videoWidth = this.videoHeight * videoAspect;
            this.videoX = (this.canvas.width - this.videoWidth) / 2;
            this.videoY = 0;
        } else {
            this.videoWidth = this.canvas.width;
            this.videoHeight = this.videoWidth / videoAspect;
            this.videoX = 0;
            this.videoY = (this.canvas.height - this.videoHeight) / 2;
        }
    }

    initClouds() {
        // 创建随机云朵
        const numClouds = Math.ceil(this.canvas.width / 300);
        for (let i = 0; i < numClouds; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2),
                width: 100 + Math.random() * 100,
                height: 40 + Math.random() * 40,
                speed: 0.5 + Math.random()
            });
        }
    }

    update() {
        // 更新云朵位置
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * (this.canvas.height / 2);
            }
        });
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.hasVideoBackground && this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
            // 绘制视频背景
            this.ctx.drawImage(
                this.video,
                this.videoX,
                this.videoY,
                this.videoWidth,
                this.videoHeight
            );

            // 添加半透明叠加层使游戏元素更清晰
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 绘制天空
            this.ctx.fillStyle = this.config.skyColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制云朵
            this.ctx.fillStyle = this.config.cloudColor;
            this.clouds.forEach(cloud => {
                this.drawCloud(cloud);
            });
        }

        // 绘制海洋
        this.ctx.fillStyle = this.config.oceanColor;
        this.ctx.fillRect(
            0,
            this.canvas.height - this.config.oceanHeight,
            this.canvas.width,
            this.config.oceanHeight
        );
    }

    drawCloud(cloud) {
        this.ctx.beginPath();
        this.ctx.arc(
            cloud.x,
            cloud.y,
            cloud.height / 2,
            0,
            Math.PI * 2
        );
        this.ctx.arc(
            cloud.x + cloud.width * 0.3,
            cloud.y - cloud.height * 0.2,
            cloud.height * 0.6,
            0,
            Math.PI * 2
        );
        this.ctx.arc(
            cloud.x + cloud.width * 0.6,
            cloud.y,
            cloud.height * 0.4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    // 处理窗口大小变化
    handleResize() {
        this.updateVideoSize();
        this.initClouds();  // 重新生成适合新尺寸的云朵
    }

    // 清理资源
    cleanup() {
        if (this.hasVideoBackground && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }
}
