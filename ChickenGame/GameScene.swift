import SpriteKit
import GameplayKit

class GameScene: SKScene, SKPhysicsContactDelegate {
    // Physics categories
    private let chickenCategory: UInt32 = 0x1 << 0
    private let platformCategory: UInt32 = 0x1 << 1
    private let flagCategory: UInt32 = 0x1 << 2
    
    // Game objects
    private var chicken: ChickenSprite?
    private var platforms: [SKShapeNode] = []
    private var flag: SKSpriteNode?
    
    // Game state
    private var isGameOver = false
    private var score: Int = 0
    
    // Controllers
    weak var audioController: AudioController?
    
    // UI elements
    private var scoreLabel: SKLabelNode?
    
    override func didMove(to view: SKView) {
        setupPhysicsWorld()
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
    
    private func setupGame() {
        // Create background
        let background = SKSpriteNode(color: .systemBlue, size: frame.size)
        background.position = CGPoint(x: frame.midX, y: frame.midY)
        background.zPosition = -1
        addChild(background)
        
        // Create chicken
        chicken = ChickenSprite()
        if let chicken = chicken {
            chicken.position = CGPoint(x: frame.width * 0.2, y: frame.height * 0.5)
            chicken.physicsBody?.categoryBitMask = chickenCategory
            chicken.physicsBody?.collisionBitMask = platformCategory
            chicken.physicsBody?.contactTestBitMask = platformCategory | flagCategory
            addChild(chicken)
        }
        
        // Create platforms
        createPlatforms()
        
        // Create finish flag
        createFlag()
        
        // Setup UI
        setupUI()
    }
    
    private func createPlatforms() {
        // Create ground
        let ground = SKShapeNode(rectOf: CGSize(width: frame.width, height: 50))
        ground.fillColor = .green
        ground.strokeColor = .green
        ground.position = CGPoint(x: frame.midX, y: 25)
        ground.physicsBody = SKPhysicsBody(rectangleOf: ground.frame.size)
        ground.physicsBody?.isDynamic = false
        ground.physicsBody?.friction = 0.2
        ground.physicsBody?.categoryBitMask = platformCategory
        platforms.append(ground)
        addChild(ground)
        
        // Create floating platforms
        let platformPositions = [
            CGPoint(x: frame.width * 0.4, y: frame.height * 0.3),
            CGPoint(x: frame.width * 0.6, y: frame.height * 0.5),
            CGPoint(x: frame.width * 0.8, y: frame.height * 0.4)
        ]
        
        for position in platformPositions {
            let platform = SKShapeNode(rectOf: CGSize(width: 120, height: 20))
            platform.fillColor = .green
            platform.strokeColor = .green
            platform.position = position
            platform.physicsBody = SKPhysicsBody(rectangleOf: platform.frame.size)
            platform.physicsBody?.isDynamic = false
            platform.physicsBody?.friction = 0.2
            platform.physicsBody?.categoryBitMask = platformCategory
            platforms.append(platform)
            addChild(platform)
        }
    }
    
    private func createFlag() {
        flag = SKSpriteNode(color: .yellow, size: CGSize(width: 30, height: 60))
        if let flag = flag {
            flag.position = CGPoint(x: frame.width * 0.9, y: frame.height * 0.6)
            flag.physicsBody = SKPhysicsBody(rectangleOf: flag.size)
            flag.physicsBody?.isDynamic = false
            flag.physicsBody?.categoryBitMask = flagCategory
            addChild(flag)
        }
    }
    
    private func setupUI() {
        scoreLabel = SKLabelNode(text: "距离: 0")
        if let scoreLabel = scoreLabel {
            scoreLabel.fontName = "AvenirNext-Bold"
            scoreLabel.fontSize = 24
            scoreLabel.position = CGPoint(x: frame.width * 0.1, y: frame.height * 0.9)
            addChild(scoreLabel)
        }
    }
    
    override func update(_ currentTime: TimeInterval) {
        guard !isGameOver else { return }
        
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
        
        // Update UI elements position relative to camera
        scoreLabel?.position = CGPoint(x: cameraNode.position.x - frame.width * 0.4,
                                     y: cameraNode.position.y + frame.height * 0.4)
    }
    
    func didBegin(_ contact: SKPhysicsContact) {
        let collision = contact.bodyA.categoryBitMask | contact.bodyB.categoryBitMask
        
        // Check for chicken-platform collision
        if collision == (chickenCategory | platformCategory) {
            if contact.bodyA.node == chicken || contact.bodyB.node == chicken {
                chicken?.landed()
            }
        }
        
        // Check for chicken-flag collision
        if collision == (chickenCategory | flagCategory) {
            handleGameWin()
        }
    }
    
    private func handleGameWin() {
        isGameOver = true
        
        let winLabel = SKLabelNode(text: "恭喜过关！")
        winLabel.fontName = "AvenirNext-Bold"
        winLabel.fontSize = 36
        winLabel.position = CGPoint(x: camera?.position.x ?? frame.midX,
                                  y: camera?.position.y ?? frame.midY)
        addChild(winLabel)
        
        // Add restart button
        let restartButton = SKLabelNode(text: "重新开始")
        restartButton.fontName = "AvenirNext-Bold"
        restartButton.fontSize = 24
        restartButton.position = CGPoint(x: winLabel.position.x,
                                       y: winLabel.position.y - 50)
        restartButton.name = "restartButton"
        addChild(restartButton)
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
