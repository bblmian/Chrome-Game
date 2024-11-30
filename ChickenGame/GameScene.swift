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
    private var backgroundLayers: [SKNode] = []
    
    // Game state
    private var isGameOver = false
    private var score: Int = 0
    
    // Controllers
    weak var audioController: AudioController?
    
    // UI elements
    private var scoreLabel: SKLabelNode?
    private var uiContainer: SKNode?
    
    // Constraints
    private var constraints: [SKConstraint] = []
    
    override func didMove(to view: SKView) {
        setupPhysicsWorld()
        setupBackground()
        setupGame()
    }
    
    private func setupPhysicsWorld() {
        physicsWorld.gravity = CGVector(dx: 0, dy: -9.8)
        physicsWorld.contactDelegate = self
        
        // Add world bounds with gradient background
        let borderBody = SKPhysicsBody(edgeLoopFrom: frame)
        borderBody.friction = 0
        borderBody.restitution = 0
        self.physicsBody = borderBody
    }
    
    private func setupBackground() {
        // Create parallax background layers
        let colors: [(CGColor, CGColor)] = [
            (UIColor(red: 0.4, green: 0.6, blue: 1.0, alpha: 1.0).cgColor,
             UIColor(red: 0.6, green: 0.8, blue: 1.0, alpha: 1.0).cgColor),
            (UIColor(red: 0.7, green: 0.9, blue: 1.0, alpha: 0.5).cgColor,
             UIColor(red: 0.8, green: 0.95, blue: 1.0, alpha: 0.5).cgColor)
        ]
        
        for (index, gradientColors) in colors.enumerated() {
            let layer = SKNode()
            let gradientNode = SKShapeNode(rect: CGRect(x: -frame.width/2,
                                                       y: -frame.height/2,
                                                       width: frame.width * 2,
                                                       height: frame.height))
            
            let gradient = CAGradientLayer()
            gradient.colors = [gradientColors.0, gradientColors.1]
            gradient.startPoint = CGPoint(x: 0.5, y: 0)
            gradient.endPoint = CGPoint(x: 0.5, y: 1)
            
            let image = UIGraphicsImageRenderer(bounds: gradientNode.frame).image { context in
                gradient.frame = gradientNode.frame
                gradient.render(in: context.cgContext)
            }
            
            gradientNode.fillTexture = SKTexture(image: image)
            gradientNode.fillColor = .white
            gradientNode.strokeColor = .clear
            gradientNode.zPosition = CGFloat(-100 + index)
            
            layer.addChild(gradientNode)
            addChild(layer)
            backgroundLayers.append(layer)
        }
        
        // Add decorative clouds
        for _ in 0..<10 {
            let cloud = SKShapeNode(circleOfRadius: CGFloat.random(in: 30...50))
            cloud.fillColor = .white.withAlphaComponent(0.3)
            cloud.strokeColor = .clear
            cloud.position = CGPoint(x: CGFloat.random(in: 0...frame.width),
                                   y: CGFloat.random(in: frame.height/2...frame.height))
            cloud.zPosition = -90
            addChild(cloud)
            
            // Add floating animation
            let moveUp = SKAction.moveBy(x: 0, y: 10, duration: TimeInterval.random(in: 1.5...3.0))
            let moveDown = moveUp.reversed()
            let sequence = SKAction.sequence([moveUp, moveDown])
            cloud.run(SKAction.repeatForever(sequence))
        }
    }
    
    private func setupGame() {
        // Create UI container with constraints
        uiContainer = SKNode()
        if let uiContainer = uiContainer {
            addChild(uiContainer)
            
            // Add constraint to keep UI fixed to camera
            let constraint = SKConstraint.distance(SKRange(constantValue: 0),
                                                 to: camera ?? self)
            uiContainer.constraints = [constraint]
        }
        
        // Create chicken with position constraints
        chicken = ChickenSprite()
        if let chicken = chicken {
            chicken.position = CGPoint(x: frame.width * 0.2, y: frame.height * 0.5)
            chicken.physicsBody?.categoryBitMask = chickenCategory
            chicken.physicsBody?.collisionBitMask = platformCategory
            chicken.physicsBody?.contactTestBitMask = platformCategory | flagCategory
            
            // Add constraint to keep chicken within scene bounds
            let xRange = SKRange(lowerLimit: 0, upperLimit: frame.width)
            let yRange = SKRange(lowerLimit: 0, upperLimit: frame.height)
            let constraint = SKConstraint.positionX(xRange, y: yRange)
            chicken.constraints = [constraint]
            
            addChild(chicken)
        }
        
        createPlatforms()
        createFlag()
        setupUI()
    }
    
    private func createPlatforms() {
        // Create stylized ground
        let groundHeight: CGFloat = 50
        let ground = SKShapeNode(rect: CGRect(x: 0,
                                            y: 0,
                                            width: frame.width,
                                            height: groundHeight),
                               cornerRadius: 10)
        
        let gradient = CAGradientLayer()
        gradient.colors = [UIColor(red: 0.2, green: 0.8, blue: 0.2, alpha: 1.0).cgColor,
                         UIColor(red: 0.1, green: 0.6, blue: 0.1, alpha: 1.0).cgColor]
        gradient.startPoint = CGPoint(x: 0.5, y: 1)
        gradient.endPoint = CGPoint(x: 0.5, y: 0)
        
        let image = UIGraphicsImageRenderer(bounds: ground.frame).image { context in
            gradient.frame = ground.frame
            gradient.render(in: context.cgContext)
        }
        
        ground.fillTexture = SKTexture(image: image)
        ground.fillColor = .white
        ground.strokeColor = UIColor(red: 0.1, green: 0.6, blue: 0.1, alpha: 1.0)
        ground.lineWidth = 2
        ground.position = CGPoint(x: 0, y: 25)
        ground.physicsBody = SKPhysicsBody(rectangleOf: ground.frame.size)
        ground.physicsBody?.isDynamic = false
        ground.physicsBody?.friction = 0.2
        ground.physicsBody?.categoryBitMask = platformCategory
        platforms.append(ground)
        addChild(ground)
        
        // Create floating platforms with gradients and shadows
        let platformPositions = [
            CGPoint(x: frame.width * 0.4, y: frame.height * 0.3),
            CGPoint(x: frame.width * 0.6, y: frame.height * 0.5),
            CGPoint(x: frame.width * 0.8, y: frame.height * 0.4)
        ]
        
        for position in platformPositions {
            let platform = SKShapeNode(rect: CGRect(x: -60, y: -10,
                                                  width: 120, height: 20),
                                     cornerRadius: 5)
            
            let platformGradient = CAGradientLayer()
            platformGradient.colors = [UIColor(red: 0.3, green: 0.9, blue: 0.3, alpha: 1.0).cgColor,
                                     UIColor(red: 0.2, green: 0.7, blue: 0.2, alpha: 1.0).cgColor]
            platformGradient.startPoint = CGPoint(x: 0.5, y: 1)
            platformGradient.endPoint = CGPoint(x: 0.5, y: 0)
            
            let platformImage = UIGraphicsImageRenderer(bounds: platform.frame).image { context in
                platformGradient.frame = platform.frame
                platformGradient.render(in: context.cgContext)
            }
            
            platform.fillTexture = SKTexture(image: platformImage)
            platform.fillColor = .white
            platform.strokeColor = UIColor(red: 0.2, green: 0.7, blue: 0.2, alpha: 1.0)
            platform.lineWidth = 2
            platform.position = position
            platform.physicsBody = SKPhysicsBody(rectangleOf: platform.frame.size)
            platform.physicsBody?.isDynamic = false
            platform.physicsBody?.friction = 0.2
            platform.physicsBody?.categoryBitMask = platformCategory
            
            // Add platform shadow
            let shadow = SKShapeNode(rect: platform.frame, cornerRadius: 5)
            shadow.fillColor = .black
            shadow.strokeColor = .clear
            shadow.alpha = 0.2
            shadow.position = CGPoint(x: 5, y: -5)
            shadow.zPosition = -1
            platform.addChild(shadow)
            
            // Add floating animation
            let moveUp = SKAction.moveBy(x: 0, y: 5, duration: 1.5)
            let moveDown = moveUp.reversed()
            let sequence = SKAction.sequence([moveUp, moveDown])
            platform.run(SKAction.repeatForever(sequence))
            
            platforms.append(platform)
            addChild(platform)
        }
    }
    
    private func createFlag() {
        // Create a more visually appealing flag
        let flagPole = SKShapeNode(rectOf: CGSize(width: 4, height: 80))
        flagPole.fillColor = .gray
        flagPole.strokeColor = .darkGray
        flagPole.position = CGPoint(x: frame.width * 0.9, y: frame.height * 0.6)
        
        let flagPath = CGMutablePath()
        flagPath.move(to: CGPoint(x: 0, y: 0))
        flagPath.addLine(to: CGPoint(x: 30, y: 15))
        flagPath.addLine(to: CGPoint(x: 0, y: 30))
        flagPath.closeSubpath()
        
        let flag = SKShapeNode(path: flagPath)
        flag.fillColor = .yellow
        flag.strokeColor = .orange
        flag.position = CGPoint(x: 2, y: 25)
        
        // Add waving animation to flag
        let wave = SKAction.sequence([
            SKAction.scaleX(to: 1.1, duration: 0.5),
            SKAction.scaleX(to: 1.0, duration: 0.5)
        ])
        flag.run(SKAction.repeatForever(wave))
        
        flagPole.addChild(flag)
        flagPole.physicsBody = SKPhysicsBody(rectangleOf: CGSize(width: 30, height: 80))
        flagPole.physicsBody?.isDynamic = false
        flagPole.physicsBody?.categoryBitMask = flagCategory
        
        self.flag = flagPole
        addChild(flagPole)
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
            
            // Update parallax background
            updateParallaxBackground()
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
    
    private func updateParallaxBackground() {
        guard let camera = camera else { return }
        
        for (index, layer) in backgroundLayers.enumerated() {
            let parallaxFactor = CGFloat(index + 1) * 0.2
            layer.position.x = camera.position.x * parallaxFactor
        }
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
