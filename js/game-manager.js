class GameManager extends GameManagerBase {
    constructor(canvas) {
        super(canvas);
        
        // Debug logging
        this.debug = document.getElementById('debug');
        
        // Game end handling
        this.isEnding = false;
        
        // Download button
        this.downloadButton = document.getElementById('downloadButton');
        if (this.downloadButton) {
            this.downloadButton.onclick = this.handleDownload.bind(this);
        }
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    async start() {
        try {
            this.log('开始初始化游戏管理器...');

            // Verify required classes
            const requiredClasses = [
                'GameCore', 'GameLoop', 'GameState', 'GameInput',
                'GameRenderer', 'GameBackground', 'GameUI',
                'Sprite', 'Platform', 'Flag', 'Chicken',
                'AudioController', 'AudioProcessor'
            ];
            
            for (const className of requiredClasses) {
                if (typeof window[className] === 'undefined') {
                    throw new Error(`Required class ${className} is not defined`);
                }
            }

            // Verify audio system is initialized
            if (!window.audioSystem) {
                throw new Error('AudioSystem is not initialized');
            }

            // Cleanup previous instances
            if (this.gameCore) {
                this.log('清理旧游戏实例...');
                await this.gameCore.cleanup();
            }
            if (this.gameLoop) {
                this.log('停止旧游戏循环...');
                this.gameLoop.stop();
            }

            // Reset state
            this.isEnding = false;

            // Create new instances
            this.log('创建游戏核心...');
            this.gameCore = new GameCore(this.canvas);
            
            this.log('创建游戏循环...');
            this.gameLoop = new GameLoop(this.gameCore);

            // Initialize game core
            this.log('初始化游戏核心...');
            const success = await this.gameCore.initialize();
            
            if (!success) {
                throw new Error('游戏核心初始化失败');
            }

            // Set initial state to MENU
            this.gameCore.state.setState('MENU');

            this.log('游戏管理器初始化成功');
            return true;

        } catch (error) {
            this.log(`游戏管理器初始化错误: ${error.message}`);
            console.error(error);
            return false;
        }
    }

    async startGame() {
        try {
            this.log('开始启动游戏...');
            
            if (!this.gameCore || !this.gameLoop) {
                throw new Error('游戏组件未初始化');
            }

            // Reset game components
            this.log('重置游戏组件...');
            if (this.gameCore.chicken) {
                this.gameCore.chicken.reset();
            }
            if (this.gameCore.camera) {
                this.gameCore.camera.reset();
            }
            if (this.gameCore.input) {
                this.gameCore.input.reset();
            }
            
            // Set game state to PLAYING
            this.log('设置游戏状态为PLAYING...');
            this.gameCore.state.setState('PLAYING');
            
            // Start game loop
            this.log('启动游戏循环...');
            this.gameLoop.start();

            // Start recording if available
            if (this.gameCore.recorder) {
                this.log('开始录制...');
                await this.gameCore.recorder.startRecording();
            }

            // Log initial game state
            const state = this.gameCore.state.getState();
            this.log(`游戏状态: ${JSON.stringify(state)}`);

            return true;

        } catch (error) {
            this.log(`游戏启动错误: ${error.message}`);
            console.error(error);
            return false;
        }
    }

    handleGameEnd(state) {
        if (this.isEnding) return;
        this.isEnding = true;

        try {
            // Notify recorder of game end
            if (this.gameCore.recorder) {
                this.gameCore.recorder.setGameEnd();
            }

            // Update game state
            this.gameCore.state.setState(state);

            // Enable download button
            if (this.downloadButton) {
                this.downloadButton.disabled = false;
            }

            // Call global game end handler
            if (window.onGameEnd) {
                window.onGameEnd();
            }

            this.log(`游戏结束 - ${state}`);

        } catch (error) {
            this.log(`游戏结束处理错误: ${error.message}`);
            console.error(error);
        }
    }

    handleDownload() {
        try {
            if (this.gameCore && this.gameCore.recorder) {
                this.gameCore.recorder.downloadRecording();
            } else {
                this.log('录像器未找到');
            }
        } catch (error) {
            this.log(`下载处理错误: ${error.message}`);
            console.error(error);
        }
    }

    cleanup() {
        try {
            this.log('开始清理游戏资源...');

            if (this.gameLoop) {
                this.log('停止游戏循环...');
                this.gameLoop.stop();
                this.gameLoop = null;
            }

            if (this.gameCore) {
                this.log('清理游戏核心...');
                this.gameCore.cleanup();
                this.gameCore = null;
            }

            this.isEnding = false;
            this.log('游戏资源清理完成');
        } catch (error) {
            this.log(`清理错误: ${error.message}`);
            console.error(error);
        }
    }

    get recorder() {
        return this.gameCore?.recorder;
    }

    get state() {
        return this.gameCore?.state;
    }
}

window.GameManager = GameManager;
