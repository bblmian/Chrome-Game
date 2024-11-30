import Foundation

class MovementController {
    // Movement settings
    private let baseSpeed: CGFloat = 180
    private let maxSpeed: CGFloat = 350
    private let acceleration: CGFloat = 0.12
    private let deceleration: CGFloat = 0.97
    
    // Jump settings
    private let baseJumpForce: CGFloat = -350
    private let maxJumpForce: CGFloat = -500
    private let sustainedJumpForce: CGFloat = -150
    private let maxSustainedJumpTime: TimeInterval = 0.25
    
    // Movement state
    private var currentSpeed: CGFloat = 0
    private var targetSpeed: CGFloat = 0
    private var currentJumpForce: CGFloat = 0
    private var sustainedJumpTime: TimeInterval = 0
    private var isMoving: Bool = false
    private var isJumping: Bool = false
    private var lastMoveTime: TimeInterval = 0
    
    // Movement thresholds
    private let moveThreshold: Float = 0.1
    private let jumpThreshold: Float = 0.15
    private let sustainThreshold: Float = 0.1
    
    // Input debouncing
    private var lastJumpTime: TimeInterval = 0
    private let jumpCooldown: TimeInterval = 0.25
    private let moveCooldown: TimeInterval = 0.016
    
    // Input smoothing
    private var volumeHistory: [Float] = Array(repeating: 0, count: 4)
    private var pitchHistory: [Float] = Array(repeating: 0, count: 4)
    private var historyIndex: Int = 0
    
    // Speed scaling
    private let speedScale: Float = 1.5
    private let minSpeedScale: Float = 0.8
    
    // Momentum settings
    private var momentum: CGFloat = 0
    private let maxMomentum: CGFloat = 80
    private let momentumGain: CGFloat = 0.3
    private let momentumDecay: CGFloat = 0.99
    
    func update(volume: Float, pitch: Float, currentTime: TimeInterval) -> MovementState {
        // Update input history
        volumeHistory[historyIndex] = volume
        pitchHistory[historyIndex] = pitch
        historyIndex = (historyIndex + 1) % volumeHistory.count
        
        // Get smoothed input values
        let smoothVolume = getSmoothValue(from: volumeHistory)
        let smoothPitch = getSmoothValue(from: pitchHistory)
        
        // Reset movement flags
        isMoving = false
        isJumping = false
        
        // Handle movement
        if smoothVolume > moveThreshold && 
           currentTime - lastMoveTime > moveCooldown {
            // Calculate target speed with improved scaling for low volumes
            let volumeRatio: Float
            if smoothVolume < 0.3 {
                // Enhanced response for quiet sounds
                volumeRatio = minSpeedScale + 
                            (smoothVolume / 0.3) * (1 - minSpeedScale)
            } else {
                // Normal scaling for louder sounds
                volumeRatio = 1 + (smoothVolume - 0.3) * speedScale
            }
            
            let clampedRatio = min(volumeRatio, 1.5)
            targetSpeed = baseSpeed + (maxSpeed - baseSpeed) * CGFloat(clampedRatio)
            
            // Increase momentum
            momentum = min(momentum + momentumGain, maxMomentum)
            
            // Apply acceleration with momentum
            currentSpeed = currentSpeed * (1 - acceleration) + 
                         (targetSpeed + momentum) * acceleration
            
            isMoving = true
            lastMoveTime = currentTime
        } else {
            // Apply deceleration and momentum decay
            momentum *= momentumDecay
            currentSpeed = (currentSpeed + momentum) * deceleration
            if currentSpeed < 1 {
                currentSpeed = 0
                momentum = 0
            }
        }
        
        // Handle jumping
        let canJump = smoothVolume > moveThreshold
        let shouldJump = smoothPitch > jumpThreshold
        let jumpCooldownElapsed = currentTime - lastJumpTime > jumpCooldown
        
        if canJump && shouldJump && jumpCooldownElapsed {
            if !isJumping {
                // Calculate jump force based on pitch
                let pitchRatio = min(
                    ((smoothPitch - jumpThreshold) / (1 - jumpThreshold)) * 1.2,
                    1
                )
                currentJumpForce = baseJumpForce + 
                                 (maxJumpForce - baseJumpForce) * CGFloat(pitchRatio)
                sustainedJumpTime = 0
                isJumping = true
                lastJumpTime = currentTime
            } else if smoothVolume > sustainThreshold {
                // Handle sustained jump
                if sustainedJumpTime < maxSustainedJumpTime {
                    let sustainRatio = 1 - (sustainedJumpTime / maxSustainedJumpTime)
                    currentJumpForce = sustainedJumpForce * CGFloat(sustainRatio)
                    sustainedJumpTime += 0.016
                    isJumping = true
                }
            }
        } else {
            // Reset jump state if no input
            currentJumpForce = 0
            if sustainedJumpTime >= maxSustainedJumpTime {
                isJumping = false
            }
        }
        
        return MovementState(
            speed: currentSpeed,
            jumpForce: currentJumpForce,
            isMoving: isMoving,
            isJumping: isJumping,
            volume: smoothVolume,
            pitch: smoothPitch
        )
    }
    
    private func getSmoothValue(from history: [Float]) -> Float {
        let sorted = history.sorted()
        let filtered = Array(sorted[1..<sorted.count-1]) // Remove highest and lowest
        return filtered.reduce(0, +) / Float(filtered.count)
    }
    
    func reset() {
        currentSpeed = 0
        targetSpeed = 0
        currentJumpForce = 0
        sustainedJumpTime = 0
        isMoving = false
        isJumping = false
        lastJumpTime = 0
        lastMoveTime = 0
        volumeHistory = Array(repeating: 0, count: 4)
        pitchHistory = Array(repeating: 0, count: 4)
        historyIndex = 0
        momentum = 0
    }
}

struct MovementState {
    let speed: CGFloat
    let jumpForce: CGFloat
    let isMoving: Bool
    let isJumping: Bool
    let volume: Float
    let pitch: Float
}
