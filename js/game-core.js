class GameCore {
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas is required for GameCore');
        }
        
        // Verify required classes
        const requiredClasses = [
            'Sprite', 'Platform', 'Flag', 'Level', 'GameBackground',
            'GameState', 'GameInput', 'GameUI', 'Camera', 'GameRecorder',
            'Chicken', 'GameRenderer'
        ];
        for (const className of requiredClasses) {
            if (typeof window[className] === 'undefined') {
                throw new Error(`Required class ${className} is not defined`);
            }
        }

        this.canvas = canvas;
        this.debug = document.getElementById('debug');
        
        // Game components
        this.background = null;
        this.state = null;
        this.input = null;
        this.ui = null;
        this.camera = null;
        this.recorder = null;
        this.renderer = null;
        
        // Game objects
        this.level = null;
        this.physicsEngine = null;
        this.chicken = null;

        // Camera settings
        this.cameraOffset = {
            x: canvas.width * 0.3,  // Keep chicken at 30% from left
            y: canvas.height * 0.5   // Keep chicken at middle height
        };

        // Game state
        this.isGameEnding = false;

        // Debug flags
        this.debugMode = false;
        this.showColliders = false;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    async initialize() {
        try {
            this.log('初始化游戏组件...');

            // Initialize components in order
            this.log('初始化背景...');
            this.background = new GameBackground(this.canvas);
            await this.background.initialize();
            
            this.log('初始化游戏状态...');
            this.state = new GameState();
            
            this.log('初始化音频控制...');
            if (!window.audioController) {
                throw new Error('AudioController not initialized');
            }
            this.input = new GameInput(window.audioController);
            
            this.log('初始化UI...');
            this.ui = new GameUI(this.canvas);
            
            this.log('初始化关卡...');
            this.level = new Level(5000, this.canvas.height);
            
            this.log('初始化小鸡...');
            this.chicken = new Chicken(this.level.playerStart.x, this.level.playerStart.y);
            
            this.log('初始化摄像机...');
            this.camera = new Camera(this.canvas, this.level.width);
            
            this.log('初始化录像机...');
            this.recorder = new GameRecorder(this.canvas);
            
            this.log('初始化渲染器...');
            this.renderer = new GameRenderer(this.canvas);
            
            this.log('初始化物理引擎...');
            this.physicsEngine = new PhysicsEngine();
            this.physicsEngine.initialize(this.chicken, this.level.platforms, this.level.flag);

            // Reset game state
            this.isGameEnding = false;
            this.state.setState('MENU');

            this.log('游戏组件初始化成功');
            return true;
        } catch (error) {
            this.log(`游戏组件初始化错误: ${error.message}`);
            console.error(error);
            return false;
        }
    }

    update(deltaTime) {
        try {
            // Update game time
            this.state.updateTime(deltaTime);

            // Only update game logic if in PLAYING state
            if (this.state.isState('PLAYING')) {
                // Get raw audio input first
                const rawVolume = this.input.audioController.getVolumeLevel();
                const rawPitch = this.input.audioController.getPitchLevel();

                // Update UI with raw values for responsive feedback
                this.ui.setVolume(rawVolume);
                this.ui.setPitch(rawPitch);

                // Get processed input for game control
                const input = this.input.update();

                // Update chicken movement based on input
                if (input.isMoving) {
                    this.chicken.move(input.speed);
                    this.state.updateDistance(this.chicken.x);
                    if (Math.random() < 0.05) {
                        this.log(`小鸡位置: (${Math.round(this.chicken.x)}, ${Math.round(this.chicken.y)}), ` +
                                `速度: (${Math.round(this.chicken.velocityX)}, ${Math.round(this.chicken.velocityY)})`);
                    }
                }
                
                // Handle jumping with sustained jump support
                if (input.isJumping) {
                    if (!this.chicken.isJumping) {
                        this.chicken.jump(input.jumpForce);
                        this.log(`跳跃 - 力度: ${input.jumpForce}`);
                    } else if (input.volume > this.input.movementController.sustainThreshold) {
                        this.chicken.jump(input.jumpForce);
                    }
                } else {
                    this.chicken.stopSustainedJump();
                }

                // Update game systems
                this.level.update(deltaTime);
                const gameStatus = this.physicsEngine.update(deltaTime);
                
                // Update camera position
                this.updateCamera();
                
                // Update UI
                this.ui.update();
                
                // Check game status
                if (gameStatus !== 'playing' && !this.isGameEnding) {
                    this.isGameEnding = true;
                    
                    // Notify game manager of end state
                    if (window.game && window.game.manager) {
                        window.game.manager.handleGameEnd(gameStatus.toUpperCase());
                    }
                }
            }
        } catch (error) {
            this.log(`游戏更新错误: ${error.message}`);
            console.error(error);
            this.state.setState('ERROR');
        }
    }

    updateCamera() {
        if (!this.chicken || !this.camera) return;

        // Calculate target camera position
        const targetX = Math.max(0, this.chicken.x - this.cameraOffset.x);
        const targetY = Math.max(0, this.chicken.y - this.cameraOffset.y);

        // Update camera with bounds checking
        this.camera.x = Math.max(0, Math.min(targetX, this.level.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(targetY, this.level.height - this.canvas.height));
    }

    render() {
        try {
            // Use the renderer to handle all rendering
            this.renderer.render(
                this.state,
                this.background,
                this.camera,
                this.level,
                this.chicken,
                this.ui
            );
        } catch (error) {
            this.log(`渲染错误: ${error.message}`);
            console.error(error);
        }
    }

    cleanup() {
        try {
            if (this.background) this.background.cleanup();
            if (this.recorder) this.recorder.cleanup();
            this.isGameEnding = false;
            this.log('游戏资源已清理');
        } catch (error) {
            this.log(`清理错误: ${error.message}`);
            console.error(error);
        }
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.showColliders = !this.showColliders;
        if (this.renderer) {
            this.renderer.toggleDebugMode();
        }
        this.log(`调试模式: ${this.debugMode ? '开启' : '关闭'}`);
    }
}

window.GameCore = GameCore;
