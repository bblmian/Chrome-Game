import SpriteKit

class ChickenSprite: SKNode {
    // Visual components
    private var bodyNode: SKShapeNode
    private var headNode: SKShapeNode
    private var beakNode: SKShapeNode
    private var eyeNode: SKShapeNode
    private var combNode: SKShapeNode
    private var leftLegNode: SKShapeNode
    private var rightLegNode: SKShapeNode
    
    // Physics properties
    var isOnGround: Bool = false
    var isJumping: Bool = false
    
    // Movement properties
    private let jumpForce: CGFloat = -500
    private let moveSpeed: CGFloat = 500
    private let gravity: CGFloat = 900
    
    // Animation properties
    private var animationFrame: Int = 0
    private var frameCount: Int = 0
    private let animationSpeed: Int = 6
    private var jumpSquish: CGFloat = 1.0
    
    // Colors
    private let bodyColor = SKColor(red: 1.0, green: 0.88, blue: 0.21, alpha: 1.0)    // #FFE135
    private let beakColor = SKColor(red: 1.0, green: 0.5, blue: 0.0, alpha: 1.0)      // #FF7F00
    private let eyeColor = SKColor.black
    private let legColor = SKColor(red: 1.0, green: 0.27, blue: 0.0, alpha: 1.0)      // #FF4500
    
    override init() {
        // Initialize all visual components
        bodyNode = SKShapeNode(circleOfRadius: 17.5)
        headNode = SKShapeNode(circleOfRadius: 12.5)
        beakNode = SKShapeNode()
        eyeNode = SKShapeNode(circleOfRadius: 2.5)
        combNode = SKShapeNode()
        leftLegNode = SKShapeNode()
        rightLegNode = SKShapeNode()
        
        super.init()
        
        setupPhysics()
        setupVisuals()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupPhysics() {
        let body = SKPhysicsBody(circleOfRadius: 20)
        body.allowsRotation = false
        body.restitution = 0.0
        body.friction = 0.2
        body.linearDamping = 0.0
        body.angularDamping = 0.0
        body.mass = 1.0
        body.affectedByGravity = true
        
        self.physicsBody = body
    }
    
    private func setupVisuals() {
        // Body
        bodyNode.fillColor = bodyColor
        bodyNode.strokeColor = bodyColor.withAlphaComponent(0.8)
        bodyNode.lineWidth = 1
        addChild(bodyNode)
        
        // Head
        headNode.fillColor = bodyColor
        headNode.strokeColor = bodyColor.withAlphaComponent(0.8)
        headNode.lineWidth = 1
        headNode.position = CGPoint(x: 7.5, y: -7.5)
        addChild(headNode)
        
        // Eye
        eyeNode.fillColor = eyeColor
        eyeNode.strokeColor = eyeColor
        eyeNode.position = CGPoint(x: 12.5, y: -10)
        addChild(eyeNode)
        
        // Beak
        let beakPath = CGMutablePath()
        beakPath.move(to: CGPoint(x: 20, y: -7.5))
        beakPath.addLine(to: CGPoint(x: 25, y: -5))
        beakPath.addLine(to: CGPoint(x: 20, y: -2.5))
        beakPath.closeSubpath()
        beakNode.path = beakPath
        beakNode.fillColor = beakColor
        beakNode.strokeColor = beakColor
        addChild(beakNode)
        
        // Comb
        let combPath = CGMutablePath()
        combPath.move(to: CGPoint(x: 5, y: -20))
        combPath.addLine(to: CGPoint(x: 15, y: -22.5))
        combPath.addLine(to: CGPoint(x: 10, y: -12.5))
        combPath.closeSubpath()
        combNode.path = combPath
        combNode.fillColor = legColor
        combNode.strokeColor = legColor
        addChild(combNode)
        
        setupLegs()
    }
    
    private func setupLegs() {
        // Left leg
        let leftLegPath = CGMutablePath()
        leftLegPath.move(to: CGPoint(x: -10, y: 15))
        leftLegPath.addLine(to: CGPoint(x: -10, y: 25))
        leftLegNode.path = leftLegPath
        leftLegNode.lineWidth = 5
        leftLegNode.strokeColor = legColor
        addChild(leftLegNode)
        
        // Right leg
        let rightLegPath = CGMutablePath()
        rightLegPath.move(to: CGPoint(x: 5, y: 15))
        rightLegPath.addLine(to: CGPoint(x: 5, y: 25))
        rightLegNode.path = rightLegPath
        rightLegNode.lineWidth = 5
        rightLegNode.strokeColor = legColor
        addChild(rightLegNode)
    }
    
    func move(speed: CGFloat) {
        physicsBody?.velocity.dx = speed
        
        // Update animation
        frameCount += 1
        if frameCount >= animationSpeed {
            frameCount = 0
            animationFrame = (animationFrame + 1) % 2
            updateLegsAnimation()
        }
    }
    
    private func updateLegsAnimation() {
        let legOffset = CGFloat(animationFrame) * 5
        
        let leftLegPath = CGMutablePath()
        leftLegPath.move(to: CGPoint(x: -10 - legOffset, y: 15))
        leftLegPath.addLine(to: CGPoint(x: -10 - legOffset, y: 25))
        leftLegNode.path = leftLegPath
        
        let rightLegPath = CGMutablePath()
        rightLegPath.move(to: CGPoint(x: 5 + legOffset, y: 15))
        rightLegPath.addLine(to: CGPoint(x: 5 + legOffset, y: 25))
        rightLegNode.path = rightLegPath
    }
    
    func jump(force: CGFloat) {
        if !isJumping {
            physicsBody?.applyImpulse(CGVector(dx: 0, dy: force))
            isJumping = true
            isOnGround = false
            
            // Apply jump squish effect
            let squishAction = SKAction.scaleX(to: 0.9, y: 1.1, duration: 0.1)
            let unsquishAction = SKAction.scale(to: 1.0, duration: 0.1)
            run(SKAction.sequence([squishAction, unsquishAction]))
        }
    }
    
    func landed() {
        isJumping = false
        isOnGround = true
        
        // Apply land squish effect
        let squishAction = SKAction.scaleX(to: 1.1, y: 0.9, duration: 0.1)
        let unsquishAction = SKAction.scale(to: 1.0, duration: 0.1)
        run(SKAction.sequence([squishAction, unsquishAction]))
    }
    
    func update() {
        // Update facing direction based on velocity
        if let velocity = physicsBody?.velocity.dx {
            if velocity > 1 {
                xScale = abs(xScale)
            } else if velocity < -1 {
                xScale = -abs(xScale)
            }
        }
    }
    
    func reset() {
        position = CGPoint.zero
        physicsBody?.velocity = CGVector.zero
        isJumping = false
        isOnGround = false
        animationFrame = 0
        frameCount = 0
        setScale(1.0)
        updateLegsAnimation()
    }
}
