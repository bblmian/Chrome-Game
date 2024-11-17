class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.setupCanvas();
        
        // 初始化游戏对象
        this.chicken = null;
        this.platforms = [];
        this.camera = { x: 0, y: 0 };
        
        // 初始化游戏系统
        this.input = new GameInput(this);
        this.physics = new Physics();
        this.renderer = new GameRenderer(this);
        this.audioController = new AudioController(this);
        this.background = new Background(this);
        
        // 游戏状态
        this.isRunning = false;
        this.gameTime = 0;
        
        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 初始化游戏
        this.init();
    }

    setupCanvas() {
        // 计算适合的画布大小
        const aspectRatio = 16 / 9;
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        // 保持宽高比
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        
        // 设置画布大小
        this.canvas.width = width;
        this.canvas.height = height;
        
        // 存储缩放比例用于位置计算
        this.scale = width / 1600; // 1600是基准宽度
    }

    handleResize() {
        // 重新设置画布大小
        this.setupCanvas();
        
        // 重新计算游戏对象的位置和大小
        if (this.chicken) {
            this.chicken.updateSize(this.scale);
        }
        
        // 重新渲染
        if (this.isRunning) {
            this.render();
        }
    }

    init() {
        // 创建小鸡
        this.chicken = new BaseSprite({
            x: 100 * this.scale,
            y: this.canvas.height - 100 * this.scale,
            width: 40 * this.scale,
            height: 40 * this.scale,
            game: this
        });
        
        // 创建平台
        this.createPlatforms();
        
        // 开始游戏循环
        this.gameLoop();
    }

    createPlatforms() {
        // 清空现有平台
        this.platforms = [];
        
        // 创建起始平台
        this.platforms.push({
            x: 0,
            y: this.canvas.height - 40 * this.scale,
            width: 300 * this.scale,
            height: 40 * this.scale
        });
        
        // 创建随机平台
        let lastX = 300 * this.scale;
        for (let i = 0; i < 10; i++) {
            const platform = {
                x: lastX + (Math.random() * 100 + 200) * this.scale,
                y: this.canvas.height - (Math.random() * 100 + 40) * this.scale,
                width: (Math.random() * 100 + 100) * this.scale,
                height: 40 * this.scale
            };
            this.platforms.push(platform);
            lastX = platform.x + platform.width;
        }
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        // 更新游戏状态
        this.update();
        
        // 渲染画面
        this.render();
        
        // 继续循环
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        // 更新输入
        this.input.update();
        
        // 更新物理
        this.physics.update(this);
        
        // 更新音频
        this.audioController.update();
        
        // 更新相机
        this.updateCamera();
        
        // 更新游戏时间
        this.gameTime++;
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染背景
        this.background.render();
        
        // 渲染游戏对象
        this.renderer.render();
    }

    updateCamera() {
        // 相机跟随小鸡
        this.camera.x = Math.max(0, this.chicken.x - this.canvas.width * 0.3);
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        // 重置游戏状态
        this.gameTime = 0;
        
        // 重置小鸡位置
        this.chicken.x = 100 * this.scale;
        this.chicken.y = this.canvas.height - 100 * this.scale;
        this.chicken.velocityX = 0;
        this.chicken.velocityY = 0;
        
        // 重置相机
        this.camera.x = 0;
        
        // 重新创建平台
        this.createPlatforms();
    }
}
