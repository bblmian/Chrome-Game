class Level {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 平台配置
        this.platformHeight = 20;
        this.minPlatformWidth = 80;   // 减小最小平台宽度
        this.maxPlatformWidth = 160;  // 减小最大平台宽度
        this.minGapWidth = 60;        // 保持最小间隔
        this.maxGapWidth = 120;       // 保持最大间隔
        this.hazardProbability = 0.35; // 保持危险平台概率
        
        // 初始化关卡元素
        this.platforms = [];
        this.flag = null;
        
        // 设置玩家起始位置
        this.playerStart = {
            x: 100,
            y: height - 150  // 提高起始位置
        };
        
        // Debug logging
        this.debug = document.getElementById('debug');
        
        // 生成平台
        this.generatePlatforms();
        
        // 创建终点旗帜
        this.createFlag();
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    generatePlatforms() {
        try {
            // 清空现有平台
            this.platforms = [];
            
            // 添加起始平台（玩家起始位置下方的安全平台）
            const startPlatform = new Platform(
                50,  // 稍微向左偏移
                this.playerStart.y + 30,  // 在玩家起始位置下方
                200, // 较宽的起始平台
                this.platformHeight,
                'normal'
            );
            this.platforms.push(startPlatform);
            
            // 生成其他平台
            let currentX = 300;  // 从玩家起始位置右侧开始
            let currentY = this.playerStart.y;  // 从玩家高度开始
            let lastPlatformType = 'normal';
            
            while (currentX < this.width - 200) {  // 留出终点旗帜的空间
                // 随机调整高度（上下波动）
                const heightVariation = Math.random() * 100 - 50;  // -50到50的变化
                currentY = Math.min(Math.max(
                    currentY + heightVariation,
                    this.height * 0.3  // 最高点
                ), this.height * 0.7);  // 最低点
                
                // 生成平台
                const platformWidth = Math.random() * 
                                    (this.maxPlatformWidth - this.minPlatformWidth) + 
                                    this.minPlatformWidth;
                
                // 确定平台类型（避免连续的危险平台）
                let platformType;
                if (lastPlatformType === 'hazard') {
                    platformType = 'normal';
                } else {
                    platformType = Math.random() < this.hazardProbability ? 'hazard' : 'normal';
                }
                
                const platform = new Platform(
                    currentX,
                    currentY,
                    platformWidth,
                    this.platformHeight,
                    platformType
                );
                
                this.platforms.push(platform);
                lastPlatformType = platformType;
                
                // 添加间隔（根据高度差调整）
                const heightDiff = Math.abs(heightVariation);
                const gapWidth = Math.random() * 
                               (this.maxGapWidth - this.minGapWidth) + 
                               this.minGapWidth;
                               
                // 如果高度差大，增加间隔
                const gapMultiplier = heightDiff > 30 ? 1.2 : 1;
                
                currentX += platformWidth + gapWidth * gapMultiplier;
            }
            
            // 添加终点平台（稍高一些，增加挑战性）
            const finalPlatform = new Platform(
                this.width - 150,
                this.height * 0.4,  // 在较高的位置
                150,
                this.platformHeight,
                'normal'
            );
            
            this.platforms.push(finalPlatform);
            
            this.log('平台生成成功');
        } catch (error) {
            this.log(`平台生成错误: ${error.message}`);
            throw error;
        }
    }

    createFlag() {
        try {
            // 在最后一个平台上方创建旗帜
            const lastPlatform = this.platforms[this.platforms.length - 1];
            if (!lastPlatform) {
                throw new Error('没有找到最后的平台');
            }
            
            this.flag = new Flag(
                lastPlatform.x + lastPlatform.width - 50,  // 距离平台右边缘50像素
                lastPlatform.y - 50  // 在平台上方50像素
            );
            
            this.log('旗帜创建成功');
        } catch (error) {
            this.log(`旗帜创建错误: ${error.message}`);
            throw error;
        }
    }

    update(deltaTime) {
        try {
            // 更新所有平台
            for (const platform of this.platforms) {
                platform.update(deltaTime);
            }
            
            // 更新旗帜
            if (this.flag) {
                this.flag.update(deltaTime);
            }
        } catch (error) {
            this.log(`关卡更新错误: ${error.message}`);
        }
    }

    draw(ctx, camera) {
        try {
            // 绘制所有平台
            for (const platform of this.platforms) {
                if (camera.isInView(platform.x, platform.y, platform.width, platform.height)) {
                    platform.draw(ctx, camera);
                }
            }
            
            // 绘制旗帜
            if (this.flag && camera.isInView(this.flag.x, this.flag.y, this.flag.width, this.flag.height)) {
                this.flag.draw(ctx);
            }
        } catch (error) {
            this.log(`关卡渲染错误: ${error.message}`);
        }
    }

    reset() {
        try {
            // 重新生成关卡
            this.generatePlatforms();
            this.createFlag();
            this.log('关卡重置成功');
        } catch (error) {
            this.log(`关卡重置错误: ${error.message}`);
        }
    }

    getState() {
        return {
            platforms: this.platforms.map(p => p.getState()),
            flag: this.flag ? {
                x: this.flag.x,
                y: this.flag.y
            } : null,
            playerStart: { ...this.playerStart }
        };
    }
}

window.Level = Level;
