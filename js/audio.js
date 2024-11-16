// 游戏音频系统类
class GameAudio {
    constructor() {
        this.debug = document.getElementById('debug');
        this.audioContext = null;
        this.mediaStreamSource = null;
        this.analyser = null;
        this.processor = null;
        this.controller = null;
        this.isInitialized = false;
        this.processingInterval = null;
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
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建音频处理器
            this.processor = new AudioProcessor();
            
            // 创建音频控制器
            this.controller = new AudioController();
            
            // 设置为全局可访问
            window.audioController = this.controller;
            
            this.isInitialized = true;
            this.log('音频系统初始化成功');
            return true;
        } catch (error) {
            this.log(`音频系统初始化错误: ${error.message}`);
            return false;
        }
    }

    async setupStream(stream) {
        try {
            if (!this.isInitialized) {
                throw new Error('音频系统未初始化');
            }

            // 创建媒体流源
            this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
            
            // 初始化音频处理器
            const processorInitialized = await this.processor.initializeAnalyser(this.audioContext, this.mediaStreamSource);
            if (!processorInitialized) {
                throw new Error('音频处理器初始化失败');
            }
            
            // 初始化音频控制器
            const controllerInitialized = await this.controller.initialize(stream);
            if (!controllerInitialized) {
                throw new Error('音频控制器初始化失败');
            }

            // 开始音频处理循环
            this.startAudioProcessing();
            
            this.log('音频流设置成功');
            return true;
        } catch (error) {
            this.log(`音频流设置错误: ${error.message}`);
            return false;
        }
    }

    startAudioProcessing() {
        // 清理现有的处理间隔
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }

        // 设置新的处理间隔
        this.processingInterval = setInterval(() => {
            try {
                // 获取音频分析数据
                const volume = this.processor.getVolumeLevel();
                const pitch = this.processor.getPitchLevel();

                // 更新控制器的音量和音高值
                this.controller.setVolumeLevel(volume);
                this.controller.setPitchLevel(pitch);

            } catch (error) {
                this.log(`音频处理错误: ${error.message}`);
            }
        }, 16); // 约60fps的更新率
    }

    cleanup() {
        try {
            // 停止音频处理
            if (this.processingInterval) {
                clearInterval(this.processingInterval);
                this.processingInterval = null;
            }

            // 清理音频上下文
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }

            // 清理控制器
            if (this.controller) {
                this.controller.cleanup();
            }

            this.mediaStreamSource = null;
            this.analyser = null;
            this.isInitialized = false;
            this.log('音频系统已清理');
        } catch (error) {
            this.log(`音频系统清理错误: ${error.message}`);
        }
    }
}

// 导出音频类
window.GameAudio = GameAudio;

// 创建全局音频系统实例
window.audioSystem = new GameAudio();

// 确保类和实例都已创建
console.log('GameAudio class and audioSystem instance created');
