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
