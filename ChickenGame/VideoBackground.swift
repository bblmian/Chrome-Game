import SpriteKit
import AVFoundation

class VideoBackground: SKNode {
    private var videoNode: SKSpriteNode?
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureVideoDataOutput?
    
    // Video dimensions
    private var videoWidth: CGFloat = 0
    private var videoHeight: CGFloat = 0
    
    // Background settings
    private let overlayColor = UIColor(white: 1.0, alpha: 0.3)
    
    override init() {
        super.init()
        setupCaptureSession()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupCaptureSession() {
        captureSession = AVCaptureSession()
        guard let captureSession = captureSession else { return }
        
        // Configure capture session for high resolution
        captureSession.sessionPreset = .hd1280x720
        
        // Get front camera
        guard let frontCamera = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                      for: .video,
                                                      position: .front) else {
            print("Failed to get front camera")
            return
        }
        
        do {
            let input = try AVCaptureDeviceInput(device: frontCamera)
            if captureSession.canAddInput(input) {
                captureSession.addInput(input)
            }
            
            // Setup video output
            videoOutput = AVCaptureVideoDataOutput()
            if let videoOutput = videoOutput,
               captureSession.canAddOutput(videoOutput) {
                captureSession.addOutput(videoOutput)
                
                // Configure video output
                videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "videoQueue"))
                videoOutput.videoSettings = [
                    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
                ]
                
                // Get video dimensions from output settings
                if let connection = videoOutput.connection(with: .video) {
                    connection.videoOrientation = .landscapeRight
                    connection.isVideoMirrored = true
                    
                    // Store dimensions
                    let dimensions = frontCamera.activeFormat.formatDescription.dimensions
                    videoWidth = CGFloat(dimensions.width)
                    videoHeight = CGFloat(dimensions.height)
                }
            }
            
            // Start capture session
            DispatchQueue.global(qos: .userInitiated).async {
                captureSession.startRunning()
            }
            
        } catch {
            print("Failed to setup camera: \(error)")
        }
    }
    
    func updateBackground(in scene: SKScene) {
        guard let currentFrame = getCurrentVideoFrame() else { return }
        
        // Calculate dimensions to fill scene while maintaining aspect ratio
        let sceneRatio = scene.size.width / scene.size.height
        let videoRatio = videoWidth / videoHeight
        
        var drawWidth: CGFloat
        var drawHeight: CGFloat
        
        if sceneRatio > videoRatio {
            // Scene is wider than video - match width and crop height
            drawWidth = scene.size.width
            drawHeight = drawWidth / videoRatio
        } else {
            // Scene is taller than video - match height and crop width
            drawHeight = scene.size.height
            drawWidth = drawHeight * videoRatio
        }
        
        // Create video texture
        let texture = SKTexture(image: currentFrame)
        
        // Update or create video node
        if let videoNode = videoNode {
            videoNode.texture = texture
            videoNode.size = CGSize(width: drawWidth, height: drawHeight)
        } else {
            let node = SKSpriteNode(texture: texture)
            node.size = CGSize(width: drawWidth, height: drawHeight)
            node.position = CGPoint(x: scene.size.width/2, y: scene.size.height/2)
            videoNode = node
            addChild(node)
        }
        
        // Add gradient overlay
        addGradientOverlay(in: scene)
        addVignetteEffect(in: scene)
    }
    
    private func getCurrentVideoFrame() -> UIImage? {
        // This will be implemented by the AVCaptureVideoDataOutputSampleBufferDelegate
        // to return the current video frame
        return nil
    }
    
    private func addGradientOverlay(in scene: SKScene) {
        let gradientNode = SKShapeNode(rect: CGRect(origin: .zero, size: scene.size))
        let gradient = CAGradientLayer()
        gradient.frame = CGRect(origin: .zero, size: scene.size)
        gradient.colors = [
            UIColor(white: 1.0, alpha: 0.4).cgColor,
            UIColor(white: 1.0, alpha: 0.2).cgColor,
            UIColor(white: 1.0, alpha: 0.4).cgColor
        ]
        gradient.locations = [0.0, 0.5, 1.0]
        
        let image = UIGraphicsImageRenderer(size: scene.size).image { context in
            gradient.render(in: context.cgContext)
        }
        
        gradientNode.fillTexture = SKTexture(image: image)
        gradientNode.fillColor = .white
        gradientNode.strokeColor = .clear
        gradientNode.zPosition = 1
        addChild(gradientNode)
    }
    
    private func addVignetteEffect(in scene: SKScene) {
        let vignetteNode = SKShapeNode(rect: CGRect(origin: .zero, size: scene.size))
        let gradient = CAGradientLayer()
        gradient.type = .radial
        gradient.frame = CGRect(origin: .zero, size: scene.size)
        gradient.colors = [
            UIColor(white: 0, alpha: 0).cgColor,
            UIColor(white: 0, alpha: 0.3).cgColor
        ]
        gradient.locations = [0.0, 1.0]
        gradient.startPoint = CGPoint(x: 0.5, y: 0.5)
        gradient.endPoint = CGPoint(x: 1.0, y: 1.0)
        
        let image = UIGraphicsImageRenderer(size: scene.size).image { context in
            gradient.render(in: context.cgContext)
        }
        
        vignetteNode.fillTexture = SKTexture(image: image)
        vignetteNode.fillColor = .white
        vignetteNode.strokeColor = .clear
        vignetteNode.zPosition = 2
        addChild(vignetteNode)
    }
    
    func cleanup() {
        captureSession?.stopRunning()
        videoOutput?.setSampleBufferDelegate(nil, queue: nil)
        captureSession = nil
        videoOutput = nil
        videoNode?.removeFromParent()
        videoNode = nil
    }
}

extension VideoBackground: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput,
                      didOutput sampleBuffer: CMSampleBuffer,
                      from connection: AVCaptureConnection) {
        guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        
        let ciImage = CIImage(cvPixelBuffer: imageBuffer)
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let texture = SKTexture(cgImage: cgImage)
            self.videoNode?.texture = texture
        }
    }
}
