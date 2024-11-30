import SpriteKit
import GameplayKit
import AVFoundation

class GameScene: SKScene, SKPhysicsContactDelegate {
    // Physics categories
    private let chickenCategory: UInt32 = 0x1 << 0
    private let platformCategory: UInt32 = 0x1 << 1
    private let flagCategory: UInt32 = 0x1 << 2
    
    // Game objects
    private var chicken: ChickenSprite?
    private var level: Level?
    private var videoBackground: VideoBackground?
    
    // Game state
    private var isGameOver = false
    private var score: Int = 0
    
    // Controllers
    weak var audioController: AudioController?
    
    // UI elements
    private var scoreLabel: SKLabelNode?
    private var uiContainer: SKNode?
    
    override func didMove(to view: SKView) {
        setupPhysicsWorld()
        setupVideoBackground()
        setupGame()
    }
    
    private func setupPhysicsWorld() {
        physicsWorld.gravity = CGVector(dx: 0, dy: -9.8)
        physicsWorld.contactDelegate = self
        
        // Add world bounds
        let borderBody = SKPhysicsBody(edgeLoopFrom: frame)
        borderBody.friction = 0
        borderBody.restitution = 0
        self.physicsBody = borderBody
    }
    
    private func setupVideoBackground() {
        videoBackground = VideoBackground()
        if let videoBackground = videoBackground {
            videoBackground.zPosition = -100
            addChild(videoBackground)
        }
    }
    
    private func setupGame() {
        // Create UI container
        uiContainer = SKNode()
        if let uiContainer = uiContainer {
            addChild(uiContainer)
            
            // Add constraint to keep UI fixed to camera
            let uiConstraint = SKConstraint.distance(SKRange(constantValue: 0),
                                                   to: camera ?? self)
            uiContainer.constraints = [uiConstraint]
        }
        
        // Create level
        level = Level(width: 5000, height: frame.height)
        
        // Add platforms to scene
        if let level = level {
            for platform in level.platforms {
                addChild(platform.createNode())
            }
            
            // Add flag
            if let flag = level.flag {
                addChild(flag)
            }
            
            // Create chicken at correct starting position
            chicken = ChickenSprite()
            if let chicken = chicken {
                chicken.position = level.playerStart
                chicken.physicsBody?.categoryBitMask = chickenCategory
                chicken.physicsBody?.collisionBitMask = platformCategory
                chicken.physicsBody?.contactTestBitMask = platformCategory | flagCategory
                
                // Add constraint to keep chicken within level bounds
                let xRange = SKRange(lowerLimit: 0, upperLimit: level.width)
                let yRange = SKRange(lowerLimit: 0, upperLimit: level.height)
                let chickenConstraint = SKConstraint.positionX(xRange, y: yRange)
                chicken.constraints = [chickenConstraint]
                
                addChild(chicken)
            }
        }
        
        setupUI()
    }
    
    private func setupUI() {
        guard let uiContainer = uiContainer else { return }
        
        // Create stylized score display
        let scoreBackground = SKShapeNode(rect: CGRect(x: -70, y: -20,
                                                     width: 140, height: 40),
                                        cornerRadius: 20)
        scoreBackground.fillColor = .black.withAlphaComponent(0.7)
        scoreBackground.strokeColor = .white.withAlphaComponent(0.3)
        scoreBackground.lineWidth = 2
        scoreBackground.position = CGPoint(x: frame.width * 0.1,
                                         y: frame.height * 0.9)
        uiContainer.addChild(scoreBackground)
        
        scoreLabel = SKLabelNode(text: "距离: 0")
        if let scoreLabel = scoreLabel {
            scoreLabel.fontName = "AvenirNext-Bold"
            scoreLabel.fontSize = 24
            scoreLabel.fontColor = .white
            scoreLabel.verticalAlignmentMode = .center
            scoreLabel.position = CGPoint(x: 0, y: 0)
            scoreBackground.addChild(scoreLabel)
        }
    }
    
    override func update(_ currentTime: TimeInterval) {
        guard !isGameOver else { return }
        
        // Update video background
        videoBackground?.updateBackground(in: self)
        
        if let chicken = chicken, let audioController = audioController {
            // Get movement values from audio controller
            let movement = audioController.getMovementValues()
            
            // Apply movement
            if movement.isMoving {
                chicken.move(speed: movement.speed)
                updateScore(Int(chicken.position.x))
            }
            
            // Apply jumping
            if movement.isJumping {
                chicken.jump(force: movement.jumpForce)
            }
            
            // Update chicken animation
            chicken.update()
            
            // Update camera
            updateCamera()
        }
    }
    
    private func updateScore(_ distance: Int) {
        score = max(score, distance)
        scoreLabel?.text = "距离: \(score)"
    }
    
    private func updateCamera() {
        guard let chicken = chicken else { return }
        
        let cameraNode = camera ?? {
            let camera = SKCameraNode()
            self.camera = camera
            addChild(camera)
            return camera
        }()
        
        let targetX = max(frame.width/2, min(chicken.position.x, frame.width * 0.7))
        let targetY = frame.height/2
        
        let smoothing: CGFloat = 0.1
        let newX = cameraNode.position.x + (targetX - cameraNode.position.x) * smoothing
        let newY = cameraNode.position.y + (targetY - cameraNode.position.y) * smoothing
        
        cameraNode.position = CGPoint(x: newX, y: newY)
    }
    
    func didBegin(_ contact: SKPhysicsContact) {
        let collision = contact.bodyA.categoryBitMask | contact.bodyB.categoryBitMask
        
        if collision == (chickenCategory | platformCategory) {
            if contact.bodyA.node == chicken || contact.bodyB.node == chicken {
                chicken?.landed()
            }
        }
        
        if collision == (chickenCategory | flagCategory) {
            handleGameWin()
        }
    }
    
    private func handleGameWin() {
        isGameOver = true
        
        // Create stylized win screen
        let winContainer = SKNode()
        winContainer.position = CGPoint(x: camera?.position.x ?? frame.midX,
                                      y: camera?.position.y ?? frame.midY)
        
        let background = SKShapeNode(rect: CGRect(x: -150, y: -100,
                                                width: 300, height: 200),
                                   cornerRadius: 20)
        background.fillColor = .black.withAlphaComponent(0.9)
        background.strokeColor = .white
        background.lineWidth = 2
        winContainer.addChild(background)
        
        let winLabel = SKLabelNode(text: "恭喜过关！")
        winLabel.fontName = "AvenirNext-Bold"
        winLabel.fontSize = 36
        winLabel.fontColor = .white
        winLabel.position = CGPoint(x: 0, y: 30)
        background.addChild(winLabel)
        
        let restartButton = SKShapeNode(rect: CGRect(x: -60, y: -60,
                                                    width: 120, height: 40),
                                      cornerRadius: 20)
        restartButton.fillColor = .blue
        restartButton.strokeColor = .white
        restartButton.lineWidth = 2
        restartButton.name = "restartButton"
        background.addChild(restartButton)
        
        let restartLabel = SKLabelNode(text: "重新开始")
        restartLabel.fontName = "AvenirNext-Bold"
        restartLabel.fontSize = 20
        restartLabel.fontColor = .white
        restartLabel.verticalAlignmentMode = .center
        restartLabel.position = CGPoint(x: 0, y: 0)
        restartButton.addChild(restartLabel)
        
        addChild(winContainer)
        
        // Add celebration particles
        if let particles = SKEmitterNode(fileNamed: "Celebration") {
            particles.position = winContainer.position
            addChild(particles)
        }
    }
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)
        let nodes = nodes(at: location)
        
        if nodes.contains(where: { $0.name == "restartButton" }) {
            let newScene = GameScene(size: size)
            newScene.scaleMode = scaleMode
            newScene.audioController = audioController
            view?.presentScene(newScene, transition: .fade(withDuration: 0.5))
        }
    }
}
