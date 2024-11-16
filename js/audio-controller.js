class AudioController {
    constructor() {
        this.audioContext = null;
        this.mediaStreamSource = null;
        this.debug = document.getElementById('debug');
        
        // Create audio processor
        this.processor = new AudioProcessor();
        
        // Audio settings - Lowered thresholds for better sensitivity
        this.volumeSmoothing = 0.15;    // Smoother volume response
        this.pitchSmoothing = 0.1;      // Even smoother pitch response
        this.volumeThreshold = 0.08;    // Lowered threshold for easier movement
        this.pitchThreshold = 0.1;      // Lowered threshold for easier jumps
        this.noiseFloor = 0.03;         // Lowered noise floor
        
        // Input state
        this.lastVolume = 0;
        this.lastPitch = 0;
        this.isInitialized = false;
        
        // Input history for noise reduction
        this.volumeHistory = new Array(3).fill(0);  // Reduced history size for faster response
        this.pitchHistory = new Array(3).fill(0);
        this.historyIndex = 0;

        // Amplification factor
        this.volumeAmplification = 1.5;  // Amplify volume input
        this.pitchAmplification = 1.3;   // Amplify pitch input

        // Debug flags
        this.debugMode = false;
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
            // Clean up existing audio context
            await this.cleanup();

            this.log('初始化音频控制器...');

            // Create new audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.audioContext.resume();
            this.log('音频上下文已创建');
            
            // Create media stream source
            this.mediaStreamSource = this.audioContext.createMediaStreamSource(audioStream);
            this.log('媒体流源已创建');
            
            // Initialize audio processor
            const success = this.processor.initializeAnalyser(
                this.audioContext,
                this.mediaStreamSource
            );
            
            if (!success) {
                throw new Error('音频处理器初始化失败');
            }
            
            this.log('音频处理器已初始化');
            this.isInitialized = true;
            
            // Log audio context state
            this.log(`音频状态: ${this.audioContext.state}`);
            this.log(`采样率: ${this.audioContext.sampleRate}Hz`);

            return true;
        } catch (error) {
            this.log(`音频控制器初始化错误: ${error.message}`);
            this.isInitialized = false;
            throw error;
        }
    }

    getVolumeLevel() {
        if (!this.isInitialized) return 0;

        try {
            // Get raw volume from processor
            let rawVolume = this.processor.getVolumeLevel();
            
            // Apply amplification
            rawVolume *= this.volumeAmplification;
            
            // Update history
            this.volumeHistory[this.historyIndex] = rawVolume;
            
            // Get smoothed value
            const volume = this.getSmoothValue(this.volumeHistory);
            
            // Apply smoothing
            this.lastVolume = this.lastVolume * this.volumeSmoothing + 
                            volume * (1 - this.volumeSmoothing);

            // Apply threshold and noise floor
            const normalizedVolume = this.lastVolume > this.volumeThreshold ? 
                                   Math.min(1, Math.max(0, (this.lastVolume - this.noiseFloor) / 
                                          (1 - this.noiseFloor))) : 0;

            if (this.debugMode && normalizedVolume > 0) {
                this.log(`音量: ${normalizedVolume.toFixed(3)}`);
            }

            return normalizedVolume;

        } catch (error) {
            this.log(`音量计算错误: ${error.message}`);
            return 0;
        }
    }

    getPitchLevel() {
        if (!this.isInitialized) return 0;

        try {
            // Get raw pitch from processor
            let rawPitch = this.processor.getPitchLevel();
            
            // Apply amplification
            rawPitch *= this.pitchAmplification;
            
            // Update history
            this.pitchHistory[this.historyIndex] = rawPitch;
            
            // Update history index
            this.historyIndex = (this.historyIndex + 1) % this.volumeHistory.length;
            
            // Get smoothed value
            const pitch = this.getSmoothValue(this.pitchHistory);
            
            // Apply smoothing
            this.lastPitch = this.lastPitch * this.pitchSmoothing + 
                           pitch * (1 - this.pitchSmoothing);

            // Apply threshold
            const normalizedPitch = this.lastPitch > this.pitchThreshold ? 
                                  Math.min(1, (this.lastPitch - this.pitchThreshold) / 
                                  (1 - this.pitchThreshold)) : 0;

            if (this.debugMode && normalizedPitch > 0) {
                this.log(`音高: ${normalizedPitch.toFixed(3)}`);
            }

            return normalizedPitch;

        } catch (error) {
            this.log(`音高计算错误: ${error.message}`);
            return 0;
        }
    }

    getSmoothValue(history) {
        // Remove outliers
        const sorted = [...history].sort((a, b) => a - b);
        const filtered = sorted.slice(1, -1);
        
        // Calculate average of remaining values
        return filtered.reduce((sum, val) => sum + val, 0) / filtered.length || 0;
    }

    async cleanup() {
        try {
            if (this.audioContext) {
                await this.audioContext.close();
                this.audioContext = null;
            }
            this.mediaStreamSource = null;
            this.isInitialized = false;
            this.lastVolume = 0;
            this.lastPitch = 0;
            this.volumeHistory.fill(0);
            this.pitchHistory.fill(0);
            this.historyIndex = 0;
            this.log('音频控制器已清理');
        } catch (error) {
            this.log(`音频控制器清理错误: ${error.message}`);
            throw error;
        }
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.processor) {
            this.processor.toggleDebug();
        }
        this.log(`音频调试: ${this.debugMode ? '开启' : '关闭'}`);
    }

    getState() {
        return {
            isInitialized: this.isInitialized,
            contextState: this.audioContext?.state || 'closed',
            volume: this.lastVolume,
            pitch: this.lastPitch
        };
    }
}

window.AudioController = AudioController;
