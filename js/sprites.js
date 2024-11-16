// 精灵工厂类
class SpriteFactory {
    static createSprite(type, x, y, width, height) {
        switch (type.toLowerCase()) {
            case 'platform':
                return new Platform(x, y, width, height);
            case 'chicken':
                return new Chicken(x, y);
            case 'flag':
                return new Flag(x, y);
            default:
                throw new Error(`未知的精灵类型: ${type}`);
        }
    }
}

// 导出精灵工厂
window.SpriteFactory = SpriteFactory;

// 精灵状态枚举
const SpriteState = {
    IDLE: 'idle',
    MOVING: 'moving',
    JUMPING: 'jumping',
    FALLING: 'falling'
};

// 导出精灵状态
window.SpriteState = SpriteState;

// 精灵类型枚举
const SpriteType = {
    PLATFORM: 'platform',
    CHICKEN: 'chicken',
    FLAG: 'flag'
};

// 导出精灵类型
window.SpriteType = SpriteType;

// 精灵碰撞类型枚举
const CollisionType = {
    NONE: 'none',
    SOLID: 'solid',
    TRIGGER: 'trigger',
    HAZARD: 'hazard'
};

// 导出碰撞类型
window.CollisionType = CollisionType;
