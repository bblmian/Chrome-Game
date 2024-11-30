import SpriteKit

enum PlatformType {
    case normal
    case hazard
}

class Platform {
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
    let type: PlatformType
    
    init(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat, type: PlatformType) {
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.type = type
    }
    
    func createNode() -> SKNode {
        let platform = SKShapeNode(rectOf: CGSize(width: width, height: height))
        platform.position = CGPoint(x: x + width/2, y: y + height/2)
        
        // Create gradient effect
        let gradient = CAGradientLayer()
        gradient.frame = CGRect(origin: .zero, size: CGSize(width: width, height: height))
        
        switch type {
        case .normal:
            gradient.colors = [
                UIColor(red: 0.3, green: 0.9, blue: 0.3, alpha: 1.0).cgColor,
                UIColor(red: 0.2, green: 0.7, blue: 0.2, alpha: 1.0).cgColor
            ]
        case .hazard:
            gradient.colors = [
                UIColor(red: 0.9, green: 0.3, blue: 0.3, alpha: 1.0).cgColor,
                UIColor(red: 0.7, green: 0.2, blue: 0.2, alpha: 1.0).cgColor
            ]
        }
        
        gradient.startPoint = CGPoint(x: 0.5, y: 1.0)
        gradient.endPoint = CGPoint(x: 0.5, y: 0.0)
        
        let image = UIGraphicsImageRenderer(bounds: platform.frame).image { context in
            gradient.render(in: context.cgContext)
        }
        
        platform.fillTexture = SKTexture(image: image)
        platform.fillColor = .white
        platform.strokeColor = type == .normal ?
            UIColor(red: 0.1, green: 0.6, blue: 0.1, alpha: 1.0) :
            UIColor(red: 0.6, green: 0.1, blue: 0.1, alpha: 1.0)
        platform.lineWidth = 2
        
        // Add shadow effect
        let shadow = SKShapeNode(rectOf: CGSize(width: width, height: height))
        shadow.fillColor = .black
        shadow.strokeColor = .clear
        shadow.alpha = 0.2
        shadow.position = CGPoint(x: 5, y: -5)
        shadow.zPosition = -1
        platform.addChild(shadow)
        
        // Add physics body
        platform.physicsBody = SKPhysicsBody(rectangleOf: CGSize(width: width, height: height))
        platform.physicsBody?.isDynamic = false
        platform.physicsBody?.friction = 0.2
        platform.physicsBody?.categoryBitMask = 0x1 << 1  // Platform category
        
        // Add floating animation for non-ground platforms
        if y > 100 {  // Only animate platforms above ground level
            let moveUp = SKAction.moveBy(x: 0, y: 5, duration: 1.5)
            let moveDown = moveUp.reversed()
            let sequence = SKAction.sequence([moveUp, moveDown])
            platform.run(SKAction.repeatForever(sequence))
        }
        
        return platform
    }
}

class Level {
    // Level dimensions
    let width: CGFloat
    let height: CGFloat
    
    // Platform configuration
    let platformHeight: CGFloat = 20
    let minPlatformWidth: CGFloat = 80
    let maxPlatformWidth: CGFloat = 160
    let minGapWidth: CGFloat = 60
    let maxGapWidth: CGFloat = 120
    let hazardProbability: Float = 0.35
    
    // Game objects
    var platforms: [Platform] = []
    var flag: SKNode?
    
    // Player start position
    var playerStart: CGPoint
    
    init(width: CGFloat, height: CGFloat) {
        self.width = width
        self.height = height
        
        // Set player start position
        self.playerStart = CGPoint(x: 100, y: height - 150)
        
        generatePlatforms()
        createFlag()
    }
    
    func generatePlatforms() {
        // Clear existing platforms
        platforms.removeAll()
        
        // Add starting platform (safe platform under player start)
        let startPlatform = Platform(
            x: 50,  // Slightly offset to left
            y: playerStart.y + 30,  // Below player start
            width: 200,  // Wider starting platform
            height: platformHeight,
            type: .normal
        )
        platforms.append(startPlatform)
        
        // Generate other platforms
        var currentX: CGFloat = 300  // Start from right of player
        var currentY: CGFloat = playerStart.y
        var lastPlatformType: PlatformType = .normal
        
        while currentX < width - 200 {  // Leave space for flag
            // Random height variation (-50 to 50)
            let heightVariation = CGFloat.random(in: -50...50)
            currentY = min(max(
                currentY + heightVariation,
                height * 0.3  // Highest point
            ), height * 0.7)  // Lowest point
            
            // Generate platform
            let platformWidth = CGFloat.random(in: minPlatformWidth...maxPlatformWidth)
            
            // Determine platform type (avoid consecutive hazards)
            let platformType: PlatformType
            if lastPlatformType == .hazard {
                platformType = .normal
            } else {
                platformType = Float.random(in: 0...1) < hazardProbability ? .hazard : .normal
            }
            
            let platform = Platform(
                x: currentX,
                y: currentY,
                width: platformWidth,
                height: platformHeight,
                type: platformType
            )
            
            platforms.append(platform)
            lastPlatformType = platformType
            
            // Add gap (adjusted by height difference)
            let heightDiff = abs(heightVariation)
            let gapWidth = CGFloat.random(in: minGapWidth...maxGapWidth)
            
            // Increase gap if height difference is large
            let gapMultiplier: CGFloat = heightDiff > 30 ? 1.2 : 1.0
            
            currentX += platformWidth + gapWidth * gapMultiplier
        }
        
        // Add final platform (higher for challenge)
        let finalPlatform = Platform(
            x: width - 150,
            y: height * 0.4,
            width: 150,
            height: platformHeight,
            type: .normal
        )
        
        platforms.append(finalPlatform)
    }
    
    func createFlag() {
        guard let lastPlatform = platforms.last else { return }
        
        // Create flag pole
        let flagPole = SKShapeNode(rectOf: CGSize(width: 4, height: 80))
        flagPole.fillColor = .gray
        flagPole.strokeColor = .darkGray
        flagPole.position = CGPoint(
            x: lastPlatform.x + lastPlatform.width - 50,  // 50 pixels from platform edge
            y: lastPlatform.y - 50  // 50 pixels above platform
        )
        
        // Create flag
        let flagPath = CGMutablePath()
        flagPath.move(to: .zero)
        flagPath.addLine(to: CGPoint(x: 30, y: 15))
        flagPath.addLine(to: CGPoint(x: 0, y: 30))
        flagPath.closeSubpath()
        
        let flag = SKShapeNode(path: flagPath)
        flag.fillColor = .yellow
        flag.strokeColor = .orange
        flag.position = CGPoint(x: 2, y: 25)
        
        // Add waving animation
        let wave = SKAction.sequence([
            SKAction.scaleX(to: 1.1, duration: 0.5),
            SKAction.scaleX(to: 1.0, duration: 0.5)
        ])
        flag.run(SKAction.repeatForever(wave))
        
        flagPole.addChild(flag)
        
        // Add physics body for collision detection
        flagPole.physicsBody = SKPhysicsBody(rectangleOf: CGSize(width: 30, height: 80))
        flagPole.physicsBody?.isDynamic = false
        flagPole.physicsBody?.categoryBitMask = 0x1 << 2  // Flag category
        
        self.flag = flagPole
    }
    
    func reset() {
        generatePlatforms()
        createFlag()
    }
}
