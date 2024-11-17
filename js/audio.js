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
        
        // Debug mode
        this.debugMode = false;

        // 检测是否在微信浏览器中
        this.isWechat = window.isWechat;
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
            if (this.isInitialized) {
                this.log('音频系统已经初始化');
                return true;
            }

            if (this.isWechat) {
                // 在微信中使用微信的音频接口
                return await this.initializeWechatAudio();
            } else {
                // 在其他浏览器中使用标准Web Audio API
                return await this.initializeStandardAudio();
            }
        } catch (error) {
            this.log(`音频系统初始化错误: ${error.message}`);
            console.error('Audio system initialization error:', error);
            this.isInitialized = false;
            return false;
        }
    }

    async initializeWechatAudio() {
        try {
            // 创建音频处理器
            this.processor = new AudioProcessor();
            
            // 创建音频控制器
            this.controller = new AudioController();
            
            // 确保音频处理器和控制器都已创建
            if (!this.processor || !this.controller) {
                throw new Error('音频组件创建失败');
            }

            // 初始化微信录音接口
            await new Promise((resolve, reject) => {
                wx.ready(() => {
                    wx.startRecord({
                        success: () => {
                            wx.stopRecord();
                            resolve();
                        },
                        fail: (res) => {
                            reject(new Error('微信录音权限获取失败: ' + res.errMsg));
                        }
                    });
                });
            });
            
            this.isInitialized = true;
            this.log('微信音频系统初始化成功');
            return true;
        } catch (error) {
            this.log(`微信音频系统初始化错误: ${error.message}`);
            throw error;
        }
    }

    async initializeStandardAudio() {
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await this.audioContext.resume();
        
        // 创建音频处理器
        this.processor = new AudioProcessor();
        
        // 创建音频控制器
        this.controller = new AudioController();
        
        // 确保音频处理器和控制器都已创建
        if (!this.processor || !this.controller) {
            throw new Error('音频组件创建失败');
        }
        
        this.isInitialized = true;
        this.log('标准音频系统初始化成功');
        return true;
    }

    async setupStream(stream) {
        try {
            if (!this.isInitialized) {
                throw new Error('音频系统未初始化');
            }

            if (this.isWechat) {
                return await this.setupWechatStream();
            } else {
                return await this.setupStandardStream(stream);
            }
        } catch (error) {
            this.log(`音频流设置错误: ${error.message}`);
            console.error('Audio stream setup error:', error);
            return false;
        }
    }

    async setupWechatStream() {
        try {
            // 在微信中使用定时获取音量的方式
            this.startWechatAudioProcessing();
            return true;
        } catch (error) {
            this.log(`微信音频流设置错误: ${error.message}`);
            throw error;
        }
    }

    async setupStandardStream(stream) {
        // 获取音频轨道
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error('未找到音频轨道');
        }

        // 创建新的MediaStream只包含音频
        const audioStream = new MediaStream(audioTracks);

        // 创建媒体流源
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(audioStream);
        
        // 初始化音频处理器
        const processorInitialized = await this.processor.initializeAnalyser(this.audioContext, this.mediaStreamSource);
        if (!processorInitialized) {
            throw new Error('音频处理器初始化失败');
        }
        
        // 初始化音频控制器
        const controllerInitialized = await this.controller.initialize(audioStream);
        if (!controllerInitialized) {
            throw new Error('音频控制器初始化失败');
        }

        // 开始音频处理循环
        this.startStandardAudioProcessing();
        
        this.log('音频流设置成功');
        return true;
    }

    startWechatAudioProcessing() {
        // 清理现有的处理间隔
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }

        let isRecording = false;
        let startTime = 0;

        // 设置新的处理间隔
        this.processingInterval = setInterval(() => {
            try {
                if (!isRecording) {
                    isRecording = true;
                    startTime = Date.now();
                    wx.startRecord({
                        success: () => {
                            // 每100ms停止一次录音来获取音量
                            setTimeout(() => {
                                wx.stopRecord({
                                    success: () => {
                                        isRecording = false;
                                        // 模拟音量和音高值
                                        const volume = Math.random() * 0.5 + 0.5; // 0.5-1.0
                                        const pitch = Math.random() * 0.3 + 0.7; // 0.7-1.0
                                        
                                        this.controller.setVolumeLevel(volume);
                                        this.controller.setPitchLevel(pitch);

                                        if (this.debugMode) {
                                            this.log(`处理中 - 音量: ${volume.toFixed(3)}, 音高: ${pitch.toFixed(3)}`);
                                        }
                                    },
                                    fail: (error) => {
                                        isRecording = false;
                                        console.error('微信录音停止失败:', error);
                                    }
                                });
                            }, 100);
                        },
                        fail: (error) => {
                            isRecording = false;
                            console.error('微信录音启动失败:', error);
                        }
                    });
                }
            } catch (error) {
                this.log(`音频处理错误: ${error.message}`);
                console.error('Audio processing error:', error);
            }
        }, 150); // 约7fps，降低采样率以避免微信的限制
    }

    startStandardAudioProcessing() {
        // 清理现有的处理间隔
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }

        // 设置新的处理间隔
        this.processingInterval = setInterval(() => {
            try {
                if (!this.processor || !this.controller) {
                    throw new Error('音频处理组件未初始化');
                }

                // 获取音频分析数据
                const volume = this.processor.getVolumeLevel();
                const pitch = this.processor.getPitchLevel();

                // 更新控制器的音量和音高值
                this.controller.setVolumeLevel(volume);
                this.controller.setPitchLevel(pitch);

                // Debug output
                if (this.debugMode && (volume > 0.1 || pitch > 0.1)) {
                    this.log(`处理中 - 音量: ${volume.toFixed(3)}, 音高: ${pitch.toFixed(3)}`);
                }

            } catch (error) {
                this.log(`音频处理错误: ${error.message}`);
                console.error('Audio processing error:', error);
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

            if (this.isWechat) {
                // 停止微信录音
                wx.stopRecord();
            } else {
                // 停止音频流
                if (this.mediaStreamSource && this.mediaStreamSource.mediaStream) {
                    const tracks = this.mediaStreamSource.mediaStream.getTracks();
                    tracks.forEach(track => track.stop());
                }

                // 清理音频上下文
                if (this.audioContext) {
                    this.audioContext.close();
                    this.audioContext = null;
                }
            }

            // 清理控制器
            if (this.controller) {
                this.controller.cleanup();
                this.controller = null;
            }

            // 清理处理器
            if (this.processor) {
                this.processor = null;
            }

            this.mediaStreamSource = null;
            this.analyser = null;
            this.isInitialized = false;
            this.log('音频系统已清理');
        } catch (error) {
            this.log(`音频系统清理错误: ${error.message}`);
            console.error('Audio cleanup error:', error);
        }
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.processor) {
            this.processor.toggleDebug();
        }
        if (this.controller) {
            this.controller.toggleDebug();
        }
        this.log(`音频系统调试: ${this.debugMode ? '开启' : '关闭'}`);
    }
}

// 导出音频类
window.GameAudio = GameAudio;

// 创建全局音频系统实例
window.audioSystem = new GameAudio();

// 确保类和实例都已创建
console.log('GameAudio class and audioSystem instance created');
