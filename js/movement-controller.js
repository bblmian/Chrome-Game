class MovementController {
    constructor() {
        this.debug = document.getElementById('debug');
        
        // Movement settings - 调整速度和惯性
        this.baseSpeed = 180;        // 保持基础速度
        this.maxSpeed = 350;         // 保持最大速度
        this.acceleration = 0.12;    // 降低加速度，增加惯性感
        this.deceleration = 0.97;    // 提高减速度，增加滑行距离
        
        // Jump settings
        this.baseJumpForce = -350;    // 基础跳跃力
        this.maxJumpForce = -500;     // 最大跳跃力
        this.sustainedJumpForce = -150; // 持续跳跃力
        this.maxSustainedJumpTime = 0.25; // 持续跳跃时间
        
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
        this.moveThreshold = 0.1;     // 保持移动阈值
        this.jumpThreshold = 0.15;    // 保持跳跃阈值
        this.sustainThreshold = 0.1;   // 保持持续跳跃阈值
        
        // Input debouncing
        this.lastJumpTime = 0;
        this.jumpCooldown = 250;     // Jump cooldown
        this.moveCooldown = 16;      // 保持移动更新间隔
        
        // Input smoothing
        this.volumeHistory = new Array(4).fill(0);  // 保持平滑窗口大小
        this.pitchHistory = new Array(4).fill(0);
        this.historyIndex = 0;
        
        // Speed scaling
        this.speedScale = 1.5;       // 保持速度缩放
        this.minSpeedScale = 0.8;    // 保持最小速度缩放
        
        // Momentum settings - 增强动量效果
        this.momentum = 0;           // 当前动量
        this.maxMomentum = 80;       // 增加最大动量
        this.momentumGain = 0.3;     // 增加动量增加速率
        this.momentumDecay = 0.99;   // 增加动量衰减率，使惯性更持久
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
            
            volumeRatio = Math.min(volumeRatio, 1.5); // 保持速度上限
            
            this.targetSpeed = this.baseSpeed + 
                             (this.maxSpeed - this.baseSpeed) * volumeRatio;
            
            // 增加动量
            this.momentum = Math.min(this.momentum + this.momentumGain, this.maxMomentum);
            
            // Apply acceleration with momentum
            this.currentSpeed = this.currentSpeed * (1 - this.acceleration) + 
                              (this.targetSpeed + this.momentum) * this.acceleration;
            
            this.isMoving = true;
            this.lastMoveTime = currentTime;
            
            if (Math.random() < 0.05) {
                this.log(`移动 - 音量: ${smoothVolume.toFixed(2)}, ` +
                        `速度: ${this.currentSpeed.toFixed(2)}, ` +
                        `动量: ${this.momentum.toFixed(2)}`);
            }
        } else {
            // Apply deceleration and momentum decay
            this.momentum *= this.momentumDecay;
            this.currentSpeed = (this.currentSpeed + this.momentum) * this.deceleration;
            if (this.currentSpeed < 1) {
                this.currentSpeed = 0;
                this.momentum = 0;
            }
        }

        // Handle jumping
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
        this.momentum = 0;
    }

    getState() {
        return {
            speed: this.currentSpeed,
            jumpForce: this.currentJumpForce,
            isMoving: this.isMoving,
            isJumping: this.isJumping,
            facingRight: this.facingRight,
            sustainedJumpTime: this.sustainedJumpTime,
            momentum: this.momentum
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
