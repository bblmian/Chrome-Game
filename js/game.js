class Game {
    constructor() {
        // Initialize debug logging
        this.debug = document.getElementById('debug');
        this.log('游戏构造函数初始化');

        try {
            // Initialize canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('找不到画布元素');
            }

            // Verify required classes are available
            const requiredClasses = [
                'GameCore', 'GameManager', 'GameLoop', 'GameState',
                'GameRenderer', 'GameBackground', 'GameUI',
                'Sprite', 'Platform', 'Flag', 'Chicken',
                'AudioController', 'AudioProcessor', 'GameAudio'
            ];
            
            for (const className of requiredClasses) {
                if (typeof window[className] === 'undefined') {
                    throw new Error(`Required class ${className} is not defined`);
                }
            }

            // Verify audio system
            if (!window.audioSystem) {
                throw new Error('AudioSystem not found');
            }
            
            // Create game manager
            this.manager = new GameManager(this.canvas);
            
            // Make game instance globally available
            window.game = this;
            
            this.log('游戏初始化成功');
        } catch (error) {
            this.log(`游戏构造函数错误: ${error.message}`);
            throw error;
        }
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    async handleStartClick() {
        this.log('处理开始点击');
        
        try {
            // Request permissions with better error handling
            this.log('请求权限...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        width: this.canvas.width,
                        height: this.canvas.height,
                        facingMode: 'user'
                    }
                });
                this.log('权限获取成功');
            } catch (error) {
                if (error.name === 'NotAllowedError') {
                    throw new Error('需要麦克风和摄像头权限才能玩游戏。请允许权限后重试。');
                } else if (error.name === 'NotFoundError') {
                    throw new Error('未检测到麦克风或摄像头。请确保设备已正确连接。');
                } else if (error.name === 'NotReadableError') {
                    throw new Error('无法访问麦克风或摄像头。请确保没有其他程序正在使用这些设备。');
                } else {
                    throw new Error(`设备访问错误: ${error.message}`);
                }
            }

            // Initialize audio system
            this.log('初始化音频系统...');
            if (!window.audioSystem) {
                throw new Error('音频系统未找到');
            }

            // Initialize audio system
            const audioInitialized = await window.audioSystem.initialize();
            if (!audioInitialized) {
                throw new Error('音频系统初始化失败');
            }

            // Setup audio stream
            const streamSetup = await window.audioSystem.setupStream(stream);
            if (!streamSetup) {
                throw new Error('音频流设置失败');
            }

            // Initialize game components
            this.log('初始化游戏组件...');
            const success = await this.manager.start();
            if (!success) {
                throw new Error('游戏组件初始化失败');
            }

            // Start game loop
            this.log('启动游戏...');
            const gameStarted = await this.manager.startGame();
            if (!gameStarted) {
                throw new Error('游戏启动失败');
            }
            
            this.log('游戏启动成功');

        } catch (error) {
            this.log(`游戏启动错误: ${error.message}`);
            
            // Show user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.borderRadius = '10px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '1000';
            errorDiv.innerHTML = `
                <h3>游戏启动失败</h3>
                <p>${error.message}</p>
                <button onclick="this.parentElement.remove()" style="
                    background: #4CAF50;
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                ">确定</button>
            `;
            document.body.appendChild(errorDiv);

            // Re-enable start button
            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.disabled = false;
            }

            throw error;
        }
    }

    get recorder() {
        return this.manager?.recorder;
    }

    get state() {
        return this.manager?.state;
    }

    cleanup() {
        try {
            // Cleanup audio system
            if (window.audioSystem) {
                window.audioSystem.cleanup();
            }

            // Cleanup game manager
            if (this.manager) {
                this.manager.cleanup();
            }

            this.log('游戏资源已清理');
        } catch (error) {
            this.log(`清理错误: ${error.message}`);
            console.error(error);
        }
    }
}

window.Game = Game;
