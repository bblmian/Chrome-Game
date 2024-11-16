class GameManagerBase {
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas is required for GameManagerBase');
        }
        this.canvas = canvas;
        this.gameCore = null;
        this.gameLoop = null;
        
        // Bind methods
        this.start = this.start.bind(this);
        this.startGame = this.startGame.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Debug logging
        this.debug = document.getElementById('debug');
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    async start() {
        throw new Error('start() must be implemented by subclass');
    }

    async startGame() {
        throw new Error('startGame() must be implemented by subclass');
    }

    cleanup() {
        throw new Error('cleanup() must be implemented by subclass');
    }

    getState() {
        if (!this.gameCore) return null;
        
        return {
            isInitialized: !!this.gameCore,
            isRunning: this.gameLoop?.isActive() || false,
            gameState: this.gameCore.state?.getState() || null,
            hasRecorder: !!this.gameCore.recorder,
            isRecording: this.gameCore.recorder?.isActive() || false
        };
    }

    toggleDebugMode() {
        if (this.gameCore) {
            this.gameCore.toggleDebugMode();
            this.log('调试模式已切换');
        }
    }

    resize(width, height) {
        if (!this.canvas) return;
        
        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update game components
        if (this.gameCore) {
            if (this.gameCore.renderer) {
                this.gameCore.renderer.resize(width, height);
            }
            if (this.gameCore.camera) {
                this.gameCore.camera.reset();
            }
            if (this.gameCore.ui) {
                // UI might need to recalculate positions
                this.gameCore.ui.update();
            }
        }
        
        this.log(`游戏视图已调整为 ${width}x${height}`);
    }

    handleError(error) {
        this.log(`错误: ${error.message}`);
        console.error(error);
        
        // Stop game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        // Set error state
        if (this.gameCore && this.gameCore.state) {
            this.gameCore.state.setState('ERROR');
        }
        
        // Clean up resources
        this.cleanup();
        
        return false;
    }

    isActive() {
        return this.gameLoop?.isActive() || false;
    }

    isPaused() {
        return this.gameCore?.state?.isState('PAUSED') || false;
    }

    isGameOver() {
        const state = this.gameCore?.state?.getState();
        return state === 'WIN' || state === 'LOSE';
    }
}

window.GameManagerBase = GameManagerBase;
