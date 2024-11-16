// 音频控制器类
if (!window.AudioController) {
    class AudioController {
        constructor() {
            this.debug = document.getElementById('debug');
            this.stream = null;
            this.volumeLevel = 0;
            this.pitchLevel = 0;
            this.movementController = new MovementController();
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
            this.volumeLevel = volume;
        }

        setPitchLevel(pitch) {
            this.pitchLevel = pitch;
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
            this.log('音频控制器已清理');
        }
    }

    // 导出音频控制器类
    window.AudioController = AudioController;
}

// 确保类已创建
console.log('AudioController class loaded successfully');
