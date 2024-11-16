class MovementController {
    constructor() {
        this.debug = document.getElementById('debug');
        
        // Movement settings
        this.baseSpeed = 300;        // Base speed
        this.maxSpeed = 500;         // Max speed
        this.acceleration = 0.25;    // Acceleration
        this.deceleration = 0.85;    // Deceleration
        
        // Jump settings - Adjusted for better response
        this.baseJumpForce = -450;    // Base jump force
        this.maxJumpForce = -650;     // Max jump force
        this.sustainedJumpForce = -200; // Sustained jump force
        this.maxSustainedJumpTime = 0.3; // Max sustained jump duration
        
        // Movement state
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.currentJumpForce = 0;
        this.sustainedJumpTime = 0;
        this.isMoving = false;
        this.isJumping = false;
        this.facingRight = true;
        this.lastMoveTime = 0;
        
        // Movement thresholds
        this.moveThreshold = 0.05;    // Lower threshold for movement
        this.jumpThreshold = 0.1;     // Lower threshold for jumps
        this.sustainThreshold = 0.08;  // Threshold for sustaining jumps
        
        // Input debouncing
        this.lastJumpTime = 0;
        this.jumpCooldown = 250;     // Jump cooldown
        this.moveCooldown = 16;      // Movement update interval
        
        // Input smoothing
        this.volumeHistory = new Array(3).fill(0);
        this.pitchHistory = new Array(3).fill(0);
        this.historyIndex = 0;
        
        // Speed scaling
        this.speedScale = 1.5;       // Speed scaling
        this.minSpeedScale = 0.6;    // Minimum speed scale
    }

    update(volume, pitch) {
        const currentTime = Date.now();

        // Update input history
        this.volumeHistory[this.historyIndex] = volume;
        this.pitchHistory[this.historyIndex] = pitch;
        this.historyIndex = (this.historyIndex + 1) % this.volumeHistory.length;

        // Get smoothed input values
        const smoothVolume = this.getSmoothValue(this.volumeHistory);
        const smoothPitch = this.getSmoothValue(this.pitchHistory);

        // Reset movement flags
        this.isMoving = false;
        this.isJumping = false;

        // Handle movement
        if (smoothVolume > this.moveThreshold && 
            currentTime - this.lastMoveTime > this.moveCooldown) {
            // Calculate target speed with improved scaling for low volumes
            let volumeRatio;
            if (smoothVolume < 0.3) {
                // Enhanced response for quiet sounds
                volumeRatio = this.minSpeedScale + 
                            (smoothVolume / 0.3) * (1 - this.minSpeedScale);
            } else {
                // Normal scaling for louder sounds
                volumeRatio = 1 + (smoothVolume - 0.3) * this.speedScale;
            }
            
            volumeRatio = Math.min(volumeRatio, 1.5); // Cap at 150% speed
            
            this.targetSpeed = this.baseSpeed + 
                             (this.maxSpeed - this.baseSpeed) * volumeRatio;
            
            // Apply acceleration
            this.currentSpeed = this.currentSpeed * (1 - this.acceleration) + 
                              this.targetSpeed * this.acceleration;
            
            this.isMoving = true;
            this.lastMoveTime = currentTime;
            
            if (Math.random() < 0.05) {
                this.log(`移动 - 音量: ${smoothVolume.toFixed(2)}, ` +
                        `速度: ${this.currentSpeed.toFixed(2)}`);
            }
        } else {
            // Apply deceleration when no input
            this.currentSpeed *= this.deceleration;
            if (this.currentSpeed < 1) {
                this.currentSpeed = 0;
            }
        }

        // Handle jumping - Separate volume check for jumping
        const canJump = smoothVolume > this.moveThreshold;
        const shouldJump = smoothPitch > this.jumpThreshold;
        const jumpCooldownElapsed = currentTime - this.lastJumpTime > this.jumpCooldown;

        if (canJump && shouldJump && jumpCooldownElapsed) {
            if (!this.isJumping) {
                // Calculate jump force based on pitch
                const pitchRatio = Math.min(
                    ((smoothPitch - this.jumpThreshold) / (1 - this.jumpThreshold)) * 1.2,
                    1
                );
                this.currentJumpForce = this.baseJumpForce + 
                                      (this.maxJumpForce - this.baseJumpForce) * pitchRatio;
                this.sustainedJumpTime = 0;
                this.isJumping = true;
                this.lastJumpTime = currentTime;
                
                this.log(`跳跃 - 音高: ${smoothPitch.toFixed(2)}, ` +
                        `力度: ${this.currentJumpForce.toFixed(2)}`);
            } else if (smoothVolume > this.sustainThreshold) {
                // Handle sustained jump
                if (this.sustainedJumpTime < this.maxSustainedJumpTime) {
                    const sustainRatio = 1 - (this.sustainedJumpTime / this.maxSustainedJumpTime);
                    this.currentJumpForce = this.sustainedJumpForce * sustainRatio;
                    this.sustainedJumpTime += 0.016;
                    this.isJumping = true;
                }
            }
        } else {
            // Reset jump state if no input
            this.currentJumpForce = 0;
            if (this.sustainedJumpTime >= this.maxSustainedJumpTime) {
                this.isJumping = false;
            }
        }

        // Return movement state
        return {
            speed: this.currentSpeed,
            jumpForce: this.currentJumpForce,
            isMoving: this.isMoving,
            isJumping: this.isJumping,
            facingRight: true,
            volume: smoothVolume,
            pitch: smoothPitch
        };
    }

    getSmoothValue(history) {
        const sorted = [...history].sort((a, b) => a - b);
        const filtered = sorted.slice(1, -1);
        return filtered.reduce((sum, val) => sum + val, 0) / filtered.length || 0;
    }

    reset() {
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.currentJumpForce = 0;
        this.sustainedJumpTime = 0;
        this.isMoving = false;
        this.isJumping = false;
        this.facingRight = true;
        this.lastJumpTime = 0;
        this.lastMoveTime = 0;
        this.volumeHistory.fill(0);
        this.pitchHistory.fill(0);
        this.historyIndex = 0;
    }

    getState() {
        return {
            speed: this.currentSpeed,
            jumpForce: this.currentJumpForce,
            isMoving: this.isMoving,
            isJumping: this.isJumping,
            facingRight: this.facingRight,
            sustainedJumpTime: this.sustainedJumpTime
        };
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }
}

window.MovementController = MovementController;
