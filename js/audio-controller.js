// 音频控制器类
if (!window.AudioController) {
    class AudioController {
        constructor() {
            this.debug = document.getElementById('debug');
            this.stream = null;
            this.volumeLevel = 0;
            this.pitchLevel = 0;
            this.movementController = new MovementController();
            
            // Add debug flags
            this.debugAudio = false;
            
            // Add smoothing
            this.volumeSmoothing = 0.2;
            this.pitchSmoothing = 0.15;
            this.lastVolume = 0;
            this.lastPitch = 0;
        }

        log(message) {
            console.log(message);
            if (this.debug) {
                const time = new Date().toLocaleTimeString();
                this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
            }
        }

        async initialize(stream) {
            try {
                this.stream = stream;
                this.log('音频控制器初始化成功');
                return true;
            } catch (error) {
                this.log(`音频控制器初始化错误: ${error.message}`);
                return false;
            }
        }

        setVolumeLevel(volume) {
            // Apply smoothing to volume
            this.lastVolume = this.lastVolume * this.volumeSmoothing + 
                            volume * (1 - this.volumeSmoothing);
            this.volumeLevel = this.lastVolume;

            if (this.debugAudio && this.volumeLevel > 0.1) {
                this.log(`音量: ${this.volumeLevel.toFixed(3)}`);
            }
        }

        setPitchLevel(pitch) {
            // Apply smoothing to pitch
            this.lastPitch = this.lastPitch * this.pitchSmoothing + 
                           pitch * (1 - this.pitchSmoothing);
            this.pitchLevel = this.lastPitch;

            if (this.debugAudio && this.pitchLevel > 0.1) {
                this.log(`音高: ${this.pitchLevel.toFixed(3)}`);
            }
        }

        getVolumeLevel() {
            return this.volumeLevel;
        }

        getPitchLevel() {
            return this.pitchLevel;
        }

        cleanup() {
            if (this.stream) {
                const tracks = this.stream.getTracks();
                tracks.forEach(track => track.stop());
                this.stream = null;
            }
            this.volumeLevel = 0;
            this.pitchLevel = 0;
            this.lastVolume = 0;
            this.lastPitch = 0;
            this.log('音频控制器已清理');
        }

        toggleDebug() {
            this.debugAudio = !this.debugAudio;
            this.log(`音频调试: ${this.debugAudio ? '开启' : '关闭'}`);
        }
    }

    // 导出音频控制器类
    window.AudioController = AudioController;
}

// 确保类已创建
console.log('AudioController class loaded successfully');
