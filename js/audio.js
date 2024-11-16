class AudioController {
    constructor() {
        console.log('AudioController initialized');
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.volumeData = new Float32Array(2048);
        this.pitchData = new Float32Array(2048);
        this.debug = document.getElementById('debug');
        this.volumeSmoothing = 0.3;  // 降低平滑度以提高响应速度
        this.pitchSmoothing = 0.3;   // 降低平滑度以提高响应速度
        this.lastVolume = 0;
        this.lastPitch = 0;
        this.sustainedVolume = 0;     // 持续音量检测
        this.isInitialized = false;

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.getVolumeLevel = this.getVolumeLevel.bind(this);
        this.getPitchLevel = this.getPitchLevel.bind(this);
        this.getSustainedVolume = this.getSustainedVolume.bind(this);
        this.cleanup = this.cleanup.bind(this);
        this.log = this.log.bind(this);
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    async initialize(audioStream) {
        try {
            // 清理现有的音频上下文
            await this.cleanup();

            this.log('初始化音频控制器...');

            // 创建新的音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.audioContext.resume();
            this.log('音频上下文已创建');
            
            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;  // 增加FFT大小以提高频率分辨率
            this.analyser.smoothingTimeConstant = 0.1;  // 降低平滑时间以提高响应速度
            this.log('分析器节点已创建');
            
            // 创建增益节点来提升信号
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 2.0;  // 提升输入信号
            
            // 创建媒体流源
            this.mediaStreamSource = this.audioContext.createMediaStreamSource(audioStream);
            this.log('媒体流源已创建');
            
            // 连接节点
            this.mediaStreamSource.connect(gainNode);
            gainNode.connect(this.analyser);
            this.log('音频节点已连接');
            
            // 初始化数据数组
            this.volumeData = new Float32Array(this.analyser.frequencyBinCount);
            this.pitchData = new Float32Array(this.analyser.frequencyBinCount);
            
            this.isInitialized = true;
            this.log('音频控制器初始化完成');
        } catch (error) {
            this.log(`音频控制器初始化错误: ${error.message}`);
            this.isInitialized = false;
            throw error;
        }
    }

    getVolumeLevel() {
        if (!this.isInitialized || !this.analyser) return 0;

        try {
            this.analyser.getFloatFrequencyData(this.volumeData);
            
            // 计算人声范围的RMS音量
            let sum = 0;
            let count = 0;
            
            // 关注人声频率范围 (100Hz - 3000Hz)
            const startBin = Math.floor(this.volumeData.length * 0.05);  // ~100Hz
            const endBin = Math.floor(this.volumeData.length * 0.6);     // ~3000Hz
            
            for (let i = startBin; i < endBin; i++) {
                // 将dB转换为线性刻度并应用频率权重
                const amplitude = Math.pow(10, (this.volumeData[i] + 140) / 20);
                const weight = this.getFrequencyWeight(i, startBin, endBin);
                sum += amplitude * amplitude * weight;
                count += weight;
            }
            
            // 计算加权RMS并标准化
            let volume = Math.sqrt(sum / count);
            volume = Math.max(0, Math.min(1, volume * 8));  // 增加灵敏度
            
            // 应用平滑处理
            volume = this.lastVolume * this.volumeSmoothing + 
                    volume * (1 - this.volumeSmoothing);
            this.lastVolume = volume;

            // 更新持续音量
            this.sustainedVolume = Math.max(0, this.sustainedVolume * 0.95 + volume * 0.05);

            return volume;
        } catch (error) {
            this.log(`音量计算错误: ${error.message}`);
            return 0;
        }
    }

    getSustainedVolume() {
        return this.sustainedVolume;
    }

    getFrequencyWeight(bin, startBin, endBin) {
        // 创建一个权重曲线，强调人声频率
        const normalizedBin = (bin - startBin) / (endBin - startBin);
        // 在1kHz附近峰值（归一化约0.3）
        return Math.exp(-Math.pow((normalizedBin - 0.3) * 3, 2));
    }

    getPitchLevel() {
        if (!this.isInitialized || !this.analyser) return 0;

        try {
            this.analyser.getFloatFrequencyData(this.pitchData);
            
            // 在高频范围内寻找主导频率
            let maxAmplitude = -Infinity;
            let dominantBin = 0;
            
            // 关注高频范围 (1kHz - 4kHz)
            const startBin = Math.floor(this.pitchData.length * 0.2);  // ~1000Hz
            const endBin = Math.floor(this.pitchData.length * 0.8);    // ~4000Hz
            
            for (let i = startBin; i < endBin; i++) {
                // 应用频率权重
                const weight = this.getFrequencyWeight(i, startBin, endBin);
                const weightedAmplitude = this.pitchData[i] * weight;
                
                if (weightedAmplitude > maxAmplitude) {
                    maxAmplitude = weightedAmplitude;
                    dominantBin = i;
                }
            }
            
            // 标准化音高级别
            let pitch = (dominantBin - startBin) / (endBin - startBin);
            pitch = Math.max(0, Math.min(1, pitch * 1.5));  // 增加灵敏度
            
            // 应用平滑处理
            pitch = this.lastPitch * this.pitchSmoothing + 
                   pitch * (1 - this.pitchSmoothing);
            this.lastPitch = pitch;

            return pitch;
        } catch (error) {
            this.log(`音高计算错误: ${error.message}`);
            return 0;
        }
    }

    async cleanup() {
        try {
            if (this.audioContext) {
                await this.audioContext.close();
                this.audioContext = null;
            }
            this.analyser = null;
            this.mediaStreamSource = null;
            this.isInitialized = false;
            this.lastVolume = 0;
            this.lastPitch = 0;
            this.sustainedVolume = 0;
            this.log('音频控制器已清理');
        } catch (error) {
            this.log(`音频控制器清理错误: ${error.message}`);
            throw error;
        }
    }
}

// 创建全局实例
window.audioController = new AudioController();
