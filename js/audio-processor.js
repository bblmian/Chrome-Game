class AudioProcessor {
    constructor() {
        // Audio analysis settings
        this.fftSize = 2048;          // Large FFT for better frequency resolution
        this.smoothingTimeConstant = 0.6;  // Reduced smoothing for faster response
        this.minDecibels = -85;       // Increased sensitivity to quiet sounds
        this.maxDecibels = -10;
        
        // Frequency ranges - Adjusted for better voice detection
        this.bassRange = { min: 85, max: 255 };      // Bass frequencies
        this.midRange = { min: 255, max: 2000 };     // Mid frequencies (where most voice is)
        this.highRange = { min: 2000, max: 6000 };   // High frequencies
        
        // Analysis components
        this.analyser = null;
        this.audioData = null;
        this.frequencyData = null;
        
        // Volume analysis
        this.volumeSmoothing = 0.1;     // Fast volume response
        this.lastVolume = 0;
        this.volumeThreshold = 0.05;     // Lower volume threshold
        
        // Pitch analysis
        this.pitchSmoothing = 0.15;     // Smooth pitch response
        this.lastPitch = 0;
        this.pitchThreshold = 0.1;       // Lower pitch threshold
        
        // Amplification
        this.volumeAmplification = 2.0;  // Increased volume amplification
        this.pitchAmplification = 2.5;   // Further increased pitch amplification
        
        // Debug logging
        this.debug = document.getElementById('debug');
        this.debugMode = false;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    initializeAnalyser(audioContext, mediaStreamSource) {
        try {
            // Create analyser node
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
            this.analyser.minDecibels = this.minDecibels;
            this.analyser.maxDecibels = this.maxDecibels;

            // Connect audio source to analyser
            mediaStreamSource.connect(this.analyser);

            // Create data arrays
            this.audioData = new Float32Array(this.analyser.frequencyBinCount);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

            this.log('音频分析器初始化成功');
            return true;
        } catch (error) {
            this.log(`音频分析器初始化错误: ${error.message}`);
            return false;
        }
    }

    getVolumeLevel() {
        if (!this.analyser) return 0;

        try {
            // Get time domain data
            this.analyser.getFloatTimeDomainData(this.audioData);

            // Calculate RMS volume with improved sensitivity
            let sum = 0;
            let peak = 0;
            for (let i = 0; i < this.audioData.length; i++) {
                const amplitude = Math.abs(this.audioData[i]);
                sum += amplitude * amplitude;
                peak = Math.max(peak, amplitude);
            }
            
            // Combine RMS and peak for better dynamics
            const rms = Math.sqrt(sum / this.audioData.length);
            const volume = (rms * 0.7 + peak * 0.3) * this.volumeAmplification;

            // Apply smoothing
            this.lastVolume = this.lastVolume * this.volumeSmoothing + 
                            volume * (1 - this.volumeSmoothing);

            // Normalize and apply threshold
            const normalizedVolume = Math.min(1, Math.max(0, 
                this.lastVolume > this.volumeThreshold ? this.lastVolume : 0
            ));

            if (this.debugMode && normalizedVolume > 0.1) {
                this.log(`原始音量: ${normalizedVolume.toFixed(3)}`);
            }

            return normalizedVolume;

        } catch (error) {
            this.log(`音量分析错误: ${error.message}`);
            return 0;
        }
    }

    getPitchLevel() {
        if (!this.analyser) return 0;

        try {
            // Get frequency data
            this.analyser.getByteFrequencyData(this.frequencyData);

            // Calculate energy in different frequency ranges with emphasis on high frequencies
            const bassEnergy = this.getFrequencyRangeEnergy(this.bassRange) * 0.3;  // Reduce bass influence
            const midEnergy = this.getFrequencyRangeEnergy(this.midRange);
            const highEnergy = this.getFrequencyRangeEnergy(this.highRange) * 1.5;  // Emphasize high frequencies

            // Calculate pitch level based on frequency distribution
            const totalEnergy = bassEnergy + midEnergy + highEnergy;
            let pitchValue = 0;
            
            if (totalEnergy > 0) {
                // Weight higher frequencies more for better jump response
                pitchValue = ((midEnergy + highEnergy * 2) / (totalEnergy * 2)) * 
                           this.pitchAmplification;

                // Add extra boost for very high frequencies
                if (highEnergy > midEnergy) {
                    pitchValue *= 1.2;
                }
            }

            // Apply smoothing
            this.lastPitch = this.lastPitch * this.pitchSmoothing + 
                           pitchValue * (1 - this.pitchSmoothing);

            // Normalize and apply threshold
            const normalizedPitch = Math.min(1, Math.max(0,
                this.lastPitch > this.pitchThreshold ? this.lastPitch : 0
            ));

            if (this.debugMode && normalizedPitch > 0.1) {
                this.log(`原始音高: ${normalizedPitch.toFixed(3)}`);
            }

            return normalizedPitch;

        } catch (error) {
            this.log(`音高分析错误: ${error.message}`);
            return 0;
        }
    }

    getFrequencyRangeEnergy(range) {
        // Convert frequency to FFT bin
        const minBin = Math.floor(range.min * this.fftSize / 
                                (this.analyser.context.sampleRate / 2));
        const maxBin = Math.ceil(range.max * this.fftSize / 
                               (this.analyser.context.sampleRate / 2));
        
        // Calculate energy in range with improved sensitivity
        let energy = 0;
        let count = 0;
        let maxEnergy = 0;
        
        for (let i = minBin; i < maxBin && i < this.frequencyData.length; i++) {
            // Get normalized bin value
            const value = this.frequencyData[i] / 255;
            
            // Apply non-linear scaling to emphasize louder frequencies
            energy += Math.pow(value, 1.5);
            maxEnergy = Math.max(maxEnergy, value);
            count++;
        }
        
        // Combine average and peak energy
        return count > 0 ? (energy / count * 0.7 + maxEnergy * 0.3) : 0;
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        this.log(`音频分析调试: ${this.debugMode ? '开启' : '关闭'}`);
    }
}

window.AudioProcessor = AudioProcessor;
