import AVFoundation

class AudioController: NSObject, ObservableObject {
    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private let bufferSize: AVAudioFrameCount = 1024
    private let sampleRate: Double = 44100.0
    
    // Audio processing values
    @Published var volume: Float = 0.0
    @Published var pitch: Float = 0.0
    
    // Smoothing
    private let volumeSmoothing: Float = 0.2
    private let pitchSmoothing: Float = 0.15
    private var lastVolume: Float = 0.0
    private var lastPitch: Float = 0.0
    
    // Thresholds - matching web version
    let moveThreshold: Float = 0.1
    let jumpThreshold: Float = 0.15
    let sustainThreshold: Float = 0.1
    
    // Audio processing queue
    private let processingQueue = DispatchQueue(label: "com.chickengame.audioprocessing")
    private var isProcessing = false
    
    override init() {
        super.init()
    }
    
    func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else { return }
        
        inputNode = audioEngine.inputNode
        guard let inputNode = inputNode else { return }
        
        let format = inputNode.outputFormat(forBus: 0)
        
        // Install tap on input node
        inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, time in
            self?.processAudioBuffer(buffer)
        }
        
        do {
            try audioEngine.start()
        } catch {
            print("Could not start audio engine: \(error)")
        }
    }
    
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        guard !isProcessing,
              let channelData = buffer.floatChannelData?[0] else { return }
        
        isProcessing = true
        let frameCount = UInt32(buffer.frameLength)
        
        // Copy audio data to avoid sendable issues
        let audioData = Array(UnsafeBufferPointer(start: channelData, count: Int(frameCount)))
        
        processingQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Calculate volume (RMS)
            var sumSquares: Float = 0.0
            for sample in audioData {
                sumSquares += sample * sample
            }
            let rms = sqrt(sumSquares / Float(frameCount))
            
            // Calculate pitch using zero-crossing rate
            var zeroCrossings: Int = 0
            var prevSample = audioData[0]
            for i in 1..<audioData.count {
                let sample = audioData[i]
                if (sample * prevSample) < 0 {
                    zeroCrossings += 1
                }
                prevSample = sample
            }
            
            let estimatedFrequency = Float(zeroCrossings) * Float(self.sampleRate) / (2.0 * Float(frameCount))
            let normalizedPitch = min(max(estimatedFrequency / 2000.0, 0.0), 1.0) // Normalize to 0-1 range
            
            // Apply smoothing on main thread
            DispatchQueue.main.async {
                // Smooth volume
                self.lastVolume = self.lastVolume * self.volumeSmoothing +
                                rms * (1.0 - self.volumeSmoothing)
                self.volume = self.lastVolume
                
                // Smooth pitch
                self.lastPitch = self.lastPitch * self.pitchSmoothing +
                               normalizedPitch * (1.0 - self.pitchSmoothing)
                self.pitch = self.lastPitch
                
                self.isProcessing = false
            }
        }
    }
    
    func getMovementValues() -> (isMoving: Bool, speed: CGFloat, isJumping: Bool, jumpForce: CGFloat) {
        // Movement logic matching web version
        let isMoving = volume > moveThreshold
        let speed: CGFloat
        
        if volume < 0.3 {
            // Enhanced response for quiet sounds
            let volumeRatio = 0.8 + (Float(volume) / 0.3) * (1 - 0.8)
            speed = isMoving ? CGFloat(350 * volumeRatio) : 0
        } else {
            // Normal scaling for louder sounds
            let volumeRatio = 1 + (volume - 0.3) * 1.5
            speed = isMoving ? CGFloat(350 * min(volumeRatio, 1.5)) : 0
        }
        
        let isJumping = pitch > jumpThreshold && volume > moveThreshold
        let jumpForce: CGFloat
        
        if isJumping {
            // Calculate jump force based on pitch
            let pitchRatio = min(((pitch - jumpThreshold) / (1 - jumpThreshold)) * 1.2, 1)
            jumpForce = -350 - CGFloat(pitchRatio) * 150
        } else {
            jumpForce = 0
        }
        
        return (isMoving, speed, isJumping, jumpForce)
    }
    
    func cleanup() {
        inputNode?.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        volume = 0
        pitch = 0
        lastVolume = 0
        lastPitch = 0
    }
}
