class AudioController {
    constructor(game) {
        this.game = game;
        this.isInitialized = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.mediaStream = null;
        this.volumeLevel = 0;
        this.pitchLevel = 0;

        // 音频配置
        this.config = {
            fftSize: 2048,
            minVolume: 0.1,
            minPitch: 0.2,
            smoothingTimeConstant: 0.8
        };

        // 初始化音频系统
        this.init();
    }

    async init() {
        try {
            // 创建音频上下文
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // 获取麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaStream = stream;

            // 创建音频分析器
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

            // 连接节点
            source.connect(this.analyser);

            // 创建数据缓冲区
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.isInitialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Audio initialization failed:', error);
            // 在移动端，可能需要用户手动触发音频初始化
            document.addEventListener('touchstart', () => this.init(), { once: true });
        }
    }

    update() {
        if (!this.isInitialized) return;

        // 获取音频数据
        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算音量
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        this.volumeLevel = sum / (this.dataArray.length * 255); // 归一化到0-1

        // 计算音高（使用简单的峰值检测）
        let maxValue = 0;
        let maxIndex = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        this.pitchLevel = maxIndex / this.dataArray.length; // 归一化到0-1

        // 应用音频控制
        this.applyAudioControl();
    }

    applyAudioControl() {
        if (!this.game.chicken || !this.game.isRunning) return;

        // 音量控制移动
        if (this.volumeLevel > this.config.minVolume) {
            const speed = this.game.chicken.moveSpeed * this.volumeLevel;
            this.game.chicken.velocityX = speed;
        }

        // 音高控制跳跃
        if (this.pitchLevel > this.config.minPitch && !this.game.chicken.isJumping) {
            this.game.chicken.jump();
        }
    }

    // 在游戏暂停时停止音频分析
    pause() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.enabled = false);
        }
    }

    // 在游戏恢复时重新开始音频分析
    resume() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.enabled = true);
        }
    }

    // 在游戏结束时清理资源
    cleanup() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    // 获取当前音频状态
    getAudioLevels() {
        return {
            volume: this.volumeLevel,
            pitch: this.pitchLevel
        };
    }
}
