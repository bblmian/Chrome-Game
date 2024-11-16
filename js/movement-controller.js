class MovementController {
    constructor() {
        this.debug = document.getElementById('debug');
        
        // Movement settings - 增加速度
        this.baseSpeed = 250;        // 提高基础速度
        this.maxSpeed = 450;         // 提高最大速度
        this.acceleration = 0.25;    // 提高加速度
        this.deceleration = 0.9;     // 降低减速度，保持更长的动力
        
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
        
        // Movement thresholds - 降低阈值使更容易触发移动
        this.moveThreshold = 0.1;     // 降低移动阈值
        this.jumpThreshold = 0.15;    // 降低跳跃阈值
        this.sustainThreshold = 0.1;   // 降低持续跳跃阈值
        
        // Input debouncing
        this.lastJumpTime = 0;
        this.jumpCooldown = 250;     // Jump cooldown
        this.moveCooldown = 16;      // 降低移动更新间隔，使移动更流畅
        
        // Input smoothing
        this.volumeHistory = new Array(3).fill(0);  // 减少平滑窗口大小，使响应更快
        this.pitchHistory = new Array(3).fill(0);
        this.historyIndex = 0;
        
        // Speed scaling - 增加速度缩放
        this.speedScale = 2.0;       // 提高速度缩放
        this.minSpeedScale = 0.9;    // 提高最小速度缩放
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
            
            volumeRatio = Math.min(volumeRatio, 2.0); // 提高速度上限
            
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
        const filtered = sorted.slice(1, -1);  // 移除最高和最低值
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
