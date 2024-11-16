class GameInput {
    constructor(audioController) {
        if (!audioController) {
            throw new Error('AudioController is required for GameInput');
        }
        
        this.audioController = audioController;
        this.movementController = new MovementController();
        this.debug = document.getElementById('debug');
        
        // Input smoothing
        this.volumeSmoothing = 0.2;    // Volume smoothing
        this.pitchSmoothing = 0.15;    // Pitch smoothing
        this.lastVolume = 0;
        this.lastPitch = 0;
        
        // Input thresholds
        this.noiseFloor = 0.05;        // Minimum volume to consider
        this.volumeThreshold = 0.1;     // Volume threshold for movement
        this.pitchThreshold = 0.1;      // Pitch threshold for jumps
        
        // Input history for noise reduction
        this.volumeHistory = new Array(3).fill(0);  // Reduced history size for faster response
        this.pitchHistory = new Array(3).fill(0);
        this.historyIndex = 0;
        
        // Input amplification
        this.volumeAmplification = 1.5;  // Volume boost
        this.pitchAmplification = 1.8;   // Pitch boost
        
        // Debug flags
        this.debugInput = false;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    update() {
        try {
            // Get raw input values
            let rawVolume = this.audioController.getVolumeLevel();
            let rawPitch = this.audioController.getPitchLevel();

            // Apply amplification
            rawVolume *= this.volumeAmplification;
            rawPitch *= this.pitchAmplification;

            // Update input history
            this.volumeHistory[this.historyIndex] = rawVolume;
            this.pitchHistory[this.historyIndex] = rawPitch;
            this.historyIndex = (this.historyIndex + 1) % this.volumeHistory.length;

            // Get smoothed values
            const smoothVolume = this.getSmoothValue(this.volumeHistory);
            const smoothPitch = this.getSmoothValue(this.pitchHistory);

            // Apply additional smoothing
            this.lastVolume = this.lastVolume * this.volumeSmoothing + 
                            smoothVolume * (1 - this.volumeSmoothing);
            this.lastPitch = this.lastPitch * this.pitchSmoothing + 
                           smoothPitch * (1 - this.pitchSmoothing);

            // Apply thresholds and noise floor
            const volume = this.lastVolume > this.volumeThreshold ? 
                         Math.min(1, Math.max(0, (this.lastVolume - this.noiseFloor) / 
                                (1 - this.noiseFloor))) : 0;
            
            const pitch = this.lastPitch > this.pitchThreshold ? 
                        Math.min(1, (this.lastPitch - this.pitchThreshold) / 
                        (1 - this.pitchThreshold)) : 0;

            // Log input values for debugging
            if (this.debugInput && (volume > 0 || pitch > 0)) {
                this.log(`输入 - 音量:${volume.toFixed(2)}, ` +
                        `音高:${pitch.toFixed(2)}`);
            }

            // Update movement controller with processed input
            const movement = this.movementController.update(volume, pitch);

            // Log movement state for debugging
            if (this.debugInput && movement.isJumping) {
                this.log(`跳跃状态 - 力度:${movement.jumpForce.toFixed(2)}, ` +
                        `音高:${pitch.toFixed(2)}`);
            }

            return movement;

        } catch (error) {
            this.log(`输入处理错误: ${error.message}`);
            console.error('Input error:', error);
            
            // Return safe default values
            return {
                speed: 0,
                jumpForce: 0,
                isMoving: false,
                isJumping: false,
                facingRight: true,
                volume: 0,
                pitch: 0
            };
        }
    }

    getSmoothValue(history) {
        // Remove outliers
        const sorted = [...history].sort((a, b) => a - b);
        const filtered = sorted.slice(1, -1);
        
        // Calculate average of remaining values
        return filtered.reduce((sum, val) => sum + val, 0) / filtered.length || 0;
    }

    reset() {
        this.lastVolume = 0;
        this.lastPitch = 0;
        this.volumeHistory.fill(0);
        this.pitchHistory.fill(0);
        this.historyIndex = 0;
        this.movementController.reset();
    }

    getState() {
        return {
            volume: this.lastVolume,
            pitch: this.lastPitch,
            movement: this.movementController.getState()
        };
    }

    toggleDebug() {
        this.debugInput = !this.debugInput;
        this.log(`输入调试: ${this.debugInput ? '开启' : '关闭'}`);
    }
}

window.GameInput = GameInput;
