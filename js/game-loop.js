class GameLoop {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.debug = document.getElementById('debug');
        
        // Timing settings
        this.fixedTimeStep = 1/60;  // Fixed 60 updates per second
        this.maxDeltaTime = 0.1;    // Maximum allowed delta time
        this.accumulator = 0;       // Time accumulator for fixed updates
        this.lastTime = 0;
        this.currentTime = 0;
        
        // Performance monitoring
        this.frameCount = 0;
        this.fpsTime = 0;
        this.fps = 0;
        this.averageDelta = 0;
        this.deltaHistory = new Array(60).fill(0);
        this.deltaIndex = 0;
        
        // State
        this.isRunning = false;
        this.frameId = null;
        
        // Bind methods
        this.loop = this.loop.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    start() {
        if (!this.isRunning) {
            this.log('游戏循环开始');
            this.isRunning = true;
            this.lastTime = performance.now() / 1000;  // Convert to seconds
            this.accumulator = 0;
            this.frameCount = 0;
            this.fpsTime = this.lastTime;
            
            // Force an initial render
            try {
                this.gameCore.render();
            } catch (error) {
                this.log(`初始渲染错误: ${error.message}`);
            }
            
            // Start the game loop
            this.frameId = requestAnimationFrame(this.loop);
            this.log('游戏循环已启动');
        }
    }

    stop() {
        if (this.isRunning) {
            this.log('游戏循环停止');
            this.isRunning = false;
            if (this.frameId !== null) {
                cancelAnimationFrame(this.frameId);
                this.frameId = null;
            }
        }
    }

    updatePerformanceMetrics(deltaTime) {
        // Update FPS counter
        this.frameCount++;
        if (this.currentTime - this.fpsTime >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = this.currentTime;
            
            // Log performance metrics every second
            this.log(`性能指标 - FPS: ${this.fps}, ` +
                    `平均帧时间: ${(this.averageDelta * 1000).toFixed(2)}ms`);
        }

        // Update average delta time
        this.deltaHistory[this.deltaIndex] = deltaTime;
        this.deltaIndex = (this.deltaIndex + 1) % this.deltaHistory.length;
        this.averageDelta = this.deltaHistory.reduce((a, b) => a + b) / this.deltaHistory.length;
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        try {
            // Convert timestamp to seconds and calculate delta time
            this.currentTime = timestamp / 1000;
            let deltaTime = this.currentTime - this.lastTime;
            this.lastTime = this.currentTime;

            // Clamp delta time to prevent spiral of death
            deltaTime = Math.min(deltaTime, this.maxDeltaTime);

            // Update performance metrics
            this.updatePerformanceMetrics(deltaTime);

            // Accumulate time for fixed updates
            this.accumulator += deltaTime;

            // Perform fixed time step updates
            let updatesThisFrame = 0;
            const maxUpdates = 5;  // Prevent too many updates in one frame
            
            while (this.accumulator >= this.fixedTimeStep && updatesThisFrame < maxUpdates) {
                try {
                    this.gameCore.update(this.fixedTimeStep);
                    updatesThisFrame++;
                } catch (error) {
                    this.log(`游戏更新错误: ${error.message}`);
                    this.stop();
                    return;
                }
                this.accumulator -= this.fixedTimeStep;
            }

            // If we hit the max updates, drop any remaining accumulated time
            if (updatesThisFrame === maxUpdates && this.accumulator > this.fixedTimeStep) {
                this.log('警告: 丢弃过多的累积时间');
                this.accumulator = 0;
            }

            // Calculate interpolation alpha for smooth rendering
            const alpha = this.accumulator / this.fixedTimeStep;

            // Render with interpolation
            try {
                this.gameCore.render(alpha);
            } catch (error) {
                this.log(`渲染错误: ${error.message}`);
                this.stop();
                return;
            }

            // Continue loop
            this.frameId = requestAnimationFrame(this.loop);

        } catch (error) {
            this.log(`游戏循环错误: ${error.message}`);
            console.error(error);
            this.stop();
        }
    }

    isActive() {
        return this.isRunning;
    }

    getPerformanceMetrics() {
        return {
            fps: this.fps,
            averageDelta: this.averageDelta,
            frameTime: this.averageDelta * 1000  // Convert to milliseconds
        };
    }
}

// Make GameLoop available globally
window.GameLoop = GameLoop;
