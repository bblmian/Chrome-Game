import Foundation
import AVFoundation

class AudioController: ObservableObject {
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
    
    // Thresholds
    let moveThreshold: Float = 0.1
    let jumpThreshold: Float = 0.15
    let sustainThreshold: Float = 0.1
    
    func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else { return }
        
        inputNode = audioEngine.inputNode
        guard let inputNode = inputNode else { return }
        
        let format = inputNode.outputFormat(forBus: 0)
        
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
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameCount = UInt32(buffer.frameLength)
        
        // Calculate volume (RMS)
        var sumSquares: Float = 0.0
        for i in 0..<Int(frameCount) {
            let sample = channelData[i]
            sumSquares += sample * sample
        }
        let rms = sqrt(sumSquares / Float(frameCount))
        
        // Calculate pitch using zero-crossing rate
        var zeroCrossings: Int = 0
        var prevSample: Float = channelData[0]
        for i in 1..<Int(frameCount) {
            let sample = channelData[i]
            if (sample * prevSample) < 0 {
                zeroCrossings += 1
            }
            prevSample = sample
        }
        
        let estimatedFrequency = Float(zeroCrossings) * Float(sampleRate) / (2.0 * Float(frameCount))
        let normalizedPitch = min(max(estimatedFrequency / 2000.0, 0.0), 1.0) // Normalize to 0-1 range
        
        // Apply smoothing
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            // Smooth volume
            self.lastVolume = self.lastVolume * self.volumeSmoothing + 
                            rms * (1.0 - self.volumeSmoothing)
            self.volume = self.lastVolume
            
            // Smooth pitch
            self.lastPitch = self.lastPitch * self.pitchSmoothing + 
                           normalizedPitch * (1.0 - self.pitchSmoothing)
            self.pitch = self.lastPitch
        }
    }
    
    func getMovementValues() -> (isMoving: Bool, speed: CGFloat, isJumping: Bool, jumpForce: CGFloat) {
        let isMoving = volume > moveThreshold
        let speed = isMoving ? CGFloat(volume * 350) : 0
        
        let isJumping = pitch > jumpThreshold && volume > moveThreshold
        let jumpForce = isJumping ? CGFloat(-350 - pitch * 150) : 0
        
        return (isMoving, speed, isJumping, jumpForce)
    }
    
    func cleanup() {
        inputNode?.removeTap(onBus: 0)
        audioEngine?.stop()
    }
}
