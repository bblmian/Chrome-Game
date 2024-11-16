window.debugUtils = {
    debug: document.getElementById('debug'),
    videoStatus: 'inactive',
    gameStatus: 'inactive',
    renderCount: 0,
    lastRenderTime: 0,
    componentStatus: {},

    log(message, type = 'info') {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : 
                         type === 'warn' ? 'orange' : 
                         type === 'success' ? 'lime' :
                         'white';
            this.debug.innerHTML = `<span style="color: ${color}">${time} - ${message}</span>\n` + 
                                 this.debug.innerHTML;
        }
    },

    updateVideoStatus(status, settings = null) {
        this.videoStatus = status;
        if (settings) {
            this.log(`视频状态: ${status}, 分辨率: ${settings.width}x${settings.height}`, 
                     status === 'active' ? 'success' : 'info');
        } else {
            this.log(`视频状态: ${status}`, 
                     status === 'error' ? 'error' : 'info');
        }
    },

    updateGameStatus(status) {
        this.gameStatus = status;
        this.log(`游戏状态: ${status}`, 
                 status === 'running' ? 'success' : 
                 status === 'error' ? 'error' : 'info');
    },

    trackRender() {
        this.renderCount++;
        const now = performance.now();
        if (now - this.lastRenderTime > 1000) {
            this.log(`渲染频率: ${this.renderCount} FPS`);
            this.renderCount = 0;
            this.lastRenderTime = now;
        }
    },

    updateComponentStatus(componentName, status, details = null) {
        this.componentStatus[componentName] = {
            status: status,
            details: details,
            timestamp: Date.now()
        };
        
        const statusColor = status === 'active' ? 'success' :
                          status === 'error' ? 'error' :
                          status === 'warning' ? 'warn' : 'info';
        
        let message = `组件 ${componentName}: ${status}`;
        if (details) {
            message += ` - ${JSON.stringify(details)}`;
        }
        this.log(message, statusColor);
    },

    logGameObject(object, type) {
        if (!object) {
            this.log(`${type} 对象未找到`, 'error');
            return;
        }

        const position = {
            x: Math.round(object.x),
            y: Math.round(object.y)
        };

        const size = {
            width: Math.round(object.width),
            height: Math.round(object.height)
        };

        let details = `${type} - 位置:(${position.x}, ${position.y}), ` +
                     `尺寸:(${size.width}, ${size.height})`;

        if (object.velocityX !== undefined) {
            details += `, 速度:(${Math.round(object.velocityX)}, ${Math.round(object.velocityY)})`;
        }

        if (object.state !== undefined) {
            details += `, 状态:${object.state}`;
        }

        this.log(details);
    },

    logInitialization(component, success, error = null) {
        const status = success ? 'success' : 'error';
        const message = success ? 
            `${component} 初始化成功` : 
            `${component} 初始化失败: ${error?.message || '未知错误'}`;
        
        this.log(message, status);
        this.updateComponentStatus(component, success ? 'active' : 'error', error);
    },

    startPerformanceMonitoring() {
        this.lastRenderTime = performance.now();
        this.renderCount = 0;
        
        // Monitor frame rate
        const frameMonitor = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastRenderTime;
            
            if (deltaTime >= 1000) {
                const fps = Math.round((this.renderCount * 1000) / deltaTime);
                this.log(`性能监控 - FPS: ${fps}`);
                this.renderCount = 0;
                this.lastRenderTime = currentTime;
            }
            
            requestAnimationFrame(frameMonitor);
        };
        
        requestAnimationFrame(frameMonitor);
    },

    getComponentStatus() {
        return this.componentStatus;
    },

    clearLogs() {
        if (this.debug) {
            this.debug.innerHTML = '';
        }
    }
};

// Initialize performance monitoring
window.debugUtils.startPerformanceMonitoring();
