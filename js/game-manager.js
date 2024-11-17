class GameManager {
    constructor() {
        // 创建游戏实例
        this.game = new Game();
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        
        // 绑定事件处理器
        this.bindEvents();
        
        // 初始化
        this.init();
    }

    init() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // 监听移动端事件
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 处理移动端音频初始化
        document.addEventListener('touchstart', () => {
            if (this.game.audioController && !this.game.audioController.isInitialized) {
                this.game.audioController.init();
            }
        }, { once: true });

        // 阻止移动端默认行为
        document.addEventListener('touchmove', (e) => {
            if (this.isRunning) {
                e.preventDefault();
            }
        }, { passive: false });

        // 处理移动端返回按钮
        window.addEventListener('popstate', (e) => {
            if (this.isRunning) {
                e.preventDefault();
                this.pause();
            }
        });
    }

    bindEvents() {
        // 游戏开始事件
        document.addEventListener('gameStart', () => {
            this.start();
        });

        // 游戏结束事件
        document.addEventListener('gameOver', () => {
            this.stop();
        });

        // 游戏重置事件
        document.addEventListener('gameReset', () => {
            this.reset();
        });
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        // 启动游戏系统
        this.game.start();

        // 启动音频系统
        if (this.game.audioController) {
            this.game.audioController.resume();
        }

        // 分发游戏开始事件
        const event = new CustomEvent('gameStarted');
        document.dispatchEvent(event);
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = false;

        // 停止游戏系统
        this.game.stop();

        // 停止音频系统
        if (this.game.audioController) {
            this.game.audioController.pause();
        }

        // 分发游戏结束事件
        const event = new CustomEvent('gameStopped');
        document.dispatchEvent(event);
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;

        // 暂停游戏系统
        this.game.stop();

        // 暂停音频系统
        if (this.game.audioController) {
            this.game.audioController.pause();
        }

        // 分发游戏暂停事件
        const event = new CustomEvent('gamePaused');
        document.dispatchEvent(event);
    }

    resume() {
        if (!this.isPaused) return;

        this.isPaused = false;

        // 恢复游戏系统
        this.game.start();

        // 恢复音频系统
        if (this.game.audioController) {
            this.game.audioController.resume();
        }

        // 分发游戏恢复事件
        const event = new CustomEvent('gameResumed');
        document.dispatchEvent(event);
    }

    reset() {
        // 停止当前游戏
        this.stop();

        // 重置游戏状态
        this.game.reset();

        // 分发游戏重置事件
        const event = new CustomEvent('gameReset');
        document.dispatchEvent(event);
    }

    handleResize() {
        // 处理屏幕旋转或大小变化
        if (this.game.setupCanvas) {
            this.game.setupCanvas();
        }

        // 如果游戏正在运行，重新渲染
        if (this.isRunning && !this.isPaused) {
            this.game.render();
        }
    }

    // 获取游戏状态
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            score: this.game.chicken ? Math.floor(this.game.chicken.x / 100) : 0
        };
    }
}

// 创建游戏管理器实例
window.gameManager = new GameManager();
