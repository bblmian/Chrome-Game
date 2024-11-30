import SpriteKit

class ChickenSprite: SKNode {
    // Visual components with enhanced styling
    private var bodyNode: SKShapeNode
    private var headNode: SKShapeNode
    private var beakNode: SKShapeNode
    private var eyeNode: SKShapeNode
    private var pupilNode: SKShapeNode
    private var combNode: SKShapeNode
    private var leftLegNode: SKShapeNode
    private var rightLegNode: SKShapeNode
    private var tailFeathers: [SKShapeNode] = []
    private var wingNode: SKShapeNode
    
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
    
    // Colors with enhanced palette
    private let bodyColor = SKColor(red: 1.0, green: 0.88, blue: 0.21, alpha: 1.0)    // #FFE135
    private let bodyHighlightColor = SKColor(red: 1.0, green: 0.92, blue: 0.4, alpha: 1.0)
    private let bodyShadowColor = SKColor(red: 0.9, green: 0.7, blue: 0.1, alpha: 1.0)
    private let beakColor = SKColor(red: 1.0, green: 0.5, blue: 0.0, alpha: 1.0)      // #FF7F00
    private let eyeColor = SKColor.black
    private let legColor = SKColor(red: 1.0, green: 0.27, blue: 0.0, alpha: 1.0)      // #FF4500
    
    override init() {
        // Initialize all visual components with enhanced sizes
        bodyNode = SKShapeNode(circleOfRadius: 20)
        headNode = SKShapeNode(circleOfRadius: 15)
        beakNode = SKShapeNode()
        eyeNode = SKShapeNode(circleOfRadius: 4)
        pupilNode = SKShapeNode(circleOfRadius: 2)
        combNode = SKShapeNode()
        leftLegNode = SKShapeNode()
        rightLegNode = SKShapeNode()
        wingNode = SKShapeNode()
        
        super.init()
        
        setupPhysics()
        setupVisuals()
        addGlowEffect()
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
        // Body with gradient effect
        bodyNode.fillColor = bodyColor
        bodyNode.strokeColor = bodyShadowColor
        bodyNode.lineWidth = 2
        addChild(bodyNode)
        
        // Add highlight to body
        let highlight = SKShapeNode(circleOfRadius: 15)
        highlight.fillColor = bodyHighlightColor
        highlight.strokeColor = .clear
        highlight.position = CGPoint(x: -5, y: 5)
        bodyNode.addChild(highlight)
        
        // Head with gradient
        headNode.fillColor = bodyColor
        headNode.strokeColor = bodyShadowColor
        headNode.lineWidth = 2
        headNode.position = CGPoint(x: 10, y: -10)
        addChild(headNode)
        
        // Head highlight
        let headHighlight = SKShapeNode(circleOfRadius: 10)
        headHighlight.fillColor = bodyHighlightColor
        headHighlight.strokeColor = .clear
        headHighlight.position = CGPoint(x: -3, y: 3)
        headNode.addChild(headHighlight)
        
        // Eye with more detail
        eyeNode.fillColor = .white
        eyeNode.strokeColor = eyeColor
        eyeNode.lineWidth = 1
        eyeNode.position = CGPoint(x: 15, y: -8)
        addChild(eyeNode)
        
        // Pupil that follows movement
        pupilNode.fillColor = eyeColor
        pupilNode.strokeColor = .clear
        eyeNode.addChild(pupilNode)
        
        // Stylized beak
        let beakPath = CGMutablePath()
        beakPath.move(to: CGPoint(x: 0, y: 0))
        beakPath.addCurve(to: CGPoint(x: 0, y: -8),
                         control1: CGPoint(x: 15, y: 0),
                         control2: CGPoint(x: 15, y: -8))
        beakPath.addLine(to: CGPoint(x: 0, y: 0))
        
        beakNode.path = beakPath
        beakNode.fillColor = beakColor
        beakNode.strokeColor = beakColor.withAlphaComponent(0.8)
        beakNode.lineWidth = 1
        beakNode.position = CGPoint(x: 25, y: -8)
        addChild(beakNode)
        
        // Stylized comb
        let combPath = CGMutablePath()
        combPath.move(to: CGPoint(x: 0, y: 0))
        combPath.addQuadCurve(to: CGPoint(x: 15, y: -5),
                             control: CGPoint(x: 7, y: -15))
        combPath.addQuadCurve(to: CGPoint(x: 0, y: -10),
                             control: CGPoint(x: 7, y: 0))
        combPath.closeSubpath()
        
        combNode.path = combPath
        combNode.fillColor = legColor
        combNode.strokeColor = legColor.withAlphaComponent(0.8)
        combNode.lineWidth = 1
        combNode.position = CGPoint(x: 5, y: -25)
        addChild(combNode)
        
        // Wing with detail
        let wingPath = CGMutablePath()
        wingPath.move(to: CGPoint(x: 0, y: 0))
        wingPath.addQuadCurve(to: CGPoint(x: 20, y: 0),
                             control: CGPoint(x: 10, y: -10))
        wingPath.addQuadCurve(to: CGPoint(x: 0, y: 0),
                             control: CGPoint(x: 10, y: 10))
        wingNode.path = wingPath
        wingNode.fillColor = bodyColor
        wingNode.strokeColor = bodyShadowColor
        wingNode.lineWidth = 1
        wingNode.position = CGPoint(x: -5, y: 0)
        addChild(wingNode)
        
        // Tail feathers
        for i in 0..<3 {
            let feather = SKShapeNode()
            let featherPath = CGMutablePath()
            featherPath.move(to: CGPoint(x: 0, y: 0))
            featherPath.addQuadCurve(to: CGPoint(x: -15, y: CGFloat(i * 5)),
                                   control: CGPoint(x: -7, y: CGFloat(i * 2 - 5)))
            feather.path = featherPath
            feather.strokeColor = bodyShadowColor
            feather.lineWidth = 2
            feather.position = CGPoint(x: -15, y: CGFloat(-i * 5))
            tailFeathers.append(feather)
            addChild(feather)
        }
        
        setupLegs()
    }
    
    private func setupLegs() {
        // Enhanced leg style
        let legWidth: CGFloat = 3
        
        // Left leg with joints
        let leftLegPath = CGMutablePath()
        leftLegPath.move(to: CGPoint(x: -10, y: 15))
        leftLegPath.addLine(to: CGPoint(x: -10, y: 25))
        leftLegPath.addLine(to: CGPoint(x: -15, y: 30)) // Foot
        leftLegNode.path = leftLegPath
        leftLegNode.lineWidth = legWidth
        leftLegNode.strokeColor = legColor
        leftLegNode.lineCap = .round
        leftLegNode.lineJoin = .round
        addChild(leftLegNode)
        
        // Right leg with joints
        let rightLegPath = CGMutablePath()
        rightLegPath.move(to: CGPoint(x: 5, y: 15))
        rightLegPath.addLine(to: CGPoint(x: 5, y: 25))
        rightLegPath.addLine(to: CGPoint(x: 0, y: 30)) // Foot
        rightLegNode.path = rightLegPath
        rightLegNode.lineWidth = legWidth
        rightLegNode.strokeColor = legColor
        rightLegNode.lineCap = .round
        rightLegNode.lineJoin = .round
        addChild(rightLegNode)
    }
    
    private func addGlowEffect() {
        let glow = SKEffectNode()
        glow.shouldRasterize = true
        glow.filter = CIFilter(name: "CIGaussianBlur", parameters: ["inputRadius": 2.0])
        
        let glowShape = SKShapeNode(circleOfRadius: 22)
        glowShape.fillColor = bodyColor.withAlphaComponent(0.3)
        glowShape.strokeColor = .clear
        
        glow.addChild(glowShape)
        insertChild(glow, at: 0)
        
        // Add subtle pulsing animation
        let pulseOut = SKAction.scale(to: 1.1, duration: 0.5)
        let pulseIn = SKAction.scale(to: 0.9, duration: 0.5)
        let pulseSequence = SKAction.sequence([pulseOut, pulseIn])
        glow.run(SKAction.repeatForever(pulseSequence))
    }
    
    func move(speed: CGFloat) {
        physicsBody?.velocity.dx = speed
        
        // Update animation
        frameCount += 1
        if frameCount >= animationSpeed {
            frameCount = 0
            animationFrame = (animationFrame + 1) % 2
            updateLegsAnimation()
            updateWingAnimation()
        }
        
        // Update pupil position based on movement
        let pupilOffset = speed > 0 ? 1.0 : -1.0
        pupilNode.position = CGPoint(x: pupilOffset, y: 0)
    }
    
    private func updateLegsAnimation() {
        let legOffset = CGFloat(animationFrame) * 5
        
        // Animate left leg
        let leftLegPath = CGMutablePath()
        leftLegPath.move(to: CGPoint(x: -10 - legOffset, y: 15))
        leftLegPath.addLine(to: CGPoint(x: -10 - legOffset, y: 25))
        leftLegPath.addLine(to: CGPoint(x: -15 - legOffset, y: 30))
        leftLegNode.path = leftLegPath
        
        // Animate right leg
        let rightLegPath = CGMutablePath()
        rightLegPath.move(to: CGPoint(x: 5 + legOffset, y: 15))
        rightLegPath.addLine(to: CGPoint(x: 5 + legOffset, y: 25))
        rightLegPath.addLine(to: CGPoint(x: 0 + legOffset, y: 30))
        rightLegNode.path = rightLegPath
    }
    
    private func updateWingAnimation() {
        // Flap wing during movement
        let wingAction = SKAction.sequence([
            SKAction.rotate(toAngle: .pi/8, duration: 0.2),
            SKAction.rotate(toAngle: -.pi/8, duration: 0.2)
        ])
        wingNode.run(wingAction)
    }
    
    func jump(force: CGFloat) {
        if !isJumping {
            physicsBody?.applyImpulse(CGVector(dx: 0, dy: force))
            isJumping = true
            isOnGround = false
            
            // Enhanced jump animation
            let squishAction = SKAction.group([
                SKAction.scaleX(to: 0.8, y: 1.2, duration: 0.1),
                SKAction.run { [weak self] in
                    self?.wingNode.run(SKAction.rotate(toAngle: -.pi/4, duration: 0.1))
                }
            ])
            
            let unsquishAction = SKAction.group([
                SKAction.scale(to: 1.0, duration: 0.2),
                SKAction.run { [weak self] in
                    self?.wingNode.run(SKAction.rotate(toAngle: 0, duration: 0.2))
                }
            ])
            
            run(SKAction.sequence([squishAction, unsquishAction]))
        }
    }
    
    func landed() {
        isJumping = false
        isOnGround = true
        
        // Enhanced landing animation
        let squishAction = SKAction.group([
            SKAction.scaleX(to: 1.2, y: 0.8, duration: 0.1),
            SKAction.run { [weak self] in
                self?.wingNode.run(SKAction.rotate(toAngle: .pi/6, duration: 0.1))
            }
        ])
        
        let unsquishAction = SKAction.group([
            SKAction.scale(to: 1.0, duration: 0.1),
            SKAction.run { [weak self] in
                self?.wingNode.run(SKAction.rotate(toAngle: 0, duration: 0.1))
            }
        ])
        
        run(SKAction.sequence([squishAction, unsquishAction]))
    }
    
    func update() {
        // Update facing direction based on velocity
        if let velocity = physicsBody?.velocity.dx {
            if abs(velocity) > 1 {
                let newXScale = velocity > 0 ? abs(xScale) : -abs(xScale)
                if xScale != newXScale {
                    let turnAction = SKAction.scaleX(to: newXScale, duration: 0.2)
                    run(turnAction)
                }
            }
        }
        
        // Animate tail feathers
        for (index, feather) in tailFeathers.enumerated() {
            let angle = sin(Double(frameCount) * 0.1 + Double(index) * 0.5) * 0.2
            feather.run(SKAction.rotate(toAngle: CGFloat(angle), duration: 0.1))
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
        
        // Reset all animations
        wingNode.removeAllActions()
        wingNode.zRotation = 0
        tailFeathers.forEach { $0.removeAllActions() }
    }
}
