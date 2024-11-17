const GAME_STATE = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WIN: 'win',
  LOSE: 'lose'
};

Page({
  data: {
    gameState: GAME_STATE.READY,
    gameTime: 0,
    distance: 0,
    volumeLevel: 0,
    pitchLevel: 0,
    fps: 0,
    showDebug: false,
    showMessage: false,
    messageTitle: '',
    messageContent: '',
    messageButtonText: '',
    // 游戏配置
    moveThreshold: 0.15,
    jumpThreshold: 0.2,
    gameWidth: 800,
    gameHeight: 400
  },

  // 游戏对象
  gameObjects: {
    chicken: null,
    platforms: [],
    flag: null,
    camera: null
  },

  // 游戏系统
  systems: {
    canvas: null,
    ctx: null,
    camera: null,
    recorder: null,
    frameTimer: null,
    lastFrameTime: 0,
    frameCount: 0,
    lastFpsUpdate: 0
  },

  onLoad() {
    // 初始化录音管理器
    this.initRecorder();
    
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        const scale = res.windowWidth / this.data.gameWidth;
        this.setData({
          scale: scale,
          canvasWidth: this.data.gameWidth * scale,
          canvasHeight: this.data.gameHeight * scale
        });
      }
    });
  },

  onReady() {
    this.initCanvas();
    this.initCamera();
    this.initGameObjects();
  },

  async initCanvas() {
    try {
      const query = wx.createSelectorQuery();
      query.select('#gameCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          canvas.width = this.data.canvasWidth;
          canvas.height = this.data.canvasHeight;

          this.systems.canvas = canvas;
          this.systems.ctx = ctx;

          // 设置画布缩放以适应屏幕
          ctx.scale(this.data.scale, this.data.scale);
        });
    } catch (error) {
      console.error('Canvas initialization failed:', error);
      this.showError('画布初始化失败');
    }
  },

  initCamera() {
    try {
      this.systems.camera = wx.createCameraContext();
    } catch (error) {
      console.error('Camera initialization failed:', error);
      this.showError('相机初始化失败');
    }
  },

  initRecorder() {
    this.systems.recorder = wx.getRecorderManager();
    
    this.systems.recorder.onStart(() => {
      console.log('Recording started');
    });

    this.systems.recorder.onFrameRecorded((res) => {
      const { frameBuffer } = res;
      if (frameBuffer) {
        this.processAudioData(frameBuffer);
      }
    });

    this.systems.recorder.onError((error) => {
      console.error('Recorder error:', error);
      this.showError('录音错误');
    });
  },

  initGameObjects() {
    // 初始化小鸡
    this.gameObjects.chicken = {
      x: 100,
      y: this.data.gameHeight - 100,
      width: 40,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isMoving: false
    };

    // 初始化平台
    this.gameObjects.platforms = [
      { x: 0, y: this.data.gameHeight - 40, width: this.data.gameWidth, height: 40 },
      // 添加更多平台...
    ];

    // 初始化终点旗帜
    this.gameObjects.flag = {
      x: this.data.gameWidth - 100,
      y: this.data.gameHeight - 120,
      width: 40,
      height: 80
    };

    // 初始化相机
    this.gameObjects.camera = {
      x: 0,
      y: 0,
      width: this.data.gameWidth,
      height: this.data.gameHeight
    };
  },

  startGame() {
    if (this.data.gameState !== GAME_STATE.READY) return;

    // 开始录音
    this.systems.recorder.start({
      duration: 600000, // 10分钟
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'pcm',
      frameSize: 1
    });

    // 开始游戏循环
    this.startGameLoop();

    this.setData({
      gameState: GAME_STATE.PLAYING,
      gameTime: 0,
      distance: 0,
      showMessage: false
    });
  },

  startGameLoop() {
    if (this.systems.frameTimer) {
      cancelAnimationFrame(this.systems.frameTimer);
    }

    const gameLoop = () => {
      const now = performance.now();
      const deltaTime = (now - this.systems.lastFrameTime) / 1000;
      this.systems.lastFrameTime = now;

      if (this.data.gameState === GAME_STATE.PLAYING) {
        this.update(deltaTime);
        this.render();
      }

      // 更新FPS
      this.systems.frameCount++;
      if (now - this.systems.lastFpsUpdate > 1000) {
        this.setData({
          fps: this.systems.frameCount
        });
        this.systems.frameCount = 0;
        this.systems.lastFpsUpdate = now;
      }

      this.systems.frameTimer = requestAnimationFrame(gameLoop);
    };

    this.systems.lastFrameTime = performance.now();
    gameLoop();
  },

  update(deltaTime) {
    // 更新游戏时间
    this.setData({
      gameTime: this.data.gameTime + deltaTime
    });

    // 更新小鸡位置
    const chicken = this.gameObjects.chicken;
    
    // 应用重力
    chicken.velocityY += 980 * deltaTime; // 重力加速度
    
    // 更新位置
    chicken.x += chicken.velocityX * deltaTime;
    chicken.y += chicken.velocityY * deltaTime;

    // 碰撞检测
    this.checkCollisions();

    // 检查胜利条件
    if (this.checkWinCondition()) {
      this.gameWin();
    }

    // 检查失败条件
    if (this.checkLoseCondition()) {
      this.gameLose();
    }

    // 更新相机位置
    this.updateCamera();
  },

  render() {
    const ctx = this.systems.ctx;
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, this.data.gameWidth, this.data.gameHeight);

    // 应用相机变换
    ctx.save();
    ctx.translate(-this.gameObjects.camera.x, -this.gameObjects.camera.y);

    // 绘制平台
    ctx.fillStyle = '#333';
    this.gameObjects.platforms.forEach(platform => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // 绘制小鸡
    ctx.fillStyle = '#FFD700';
    const chicken = this.gameObjects.chicken;
    ctx.fillRect(chicken.x, chicken.y, chicken.width, chicken.height);

    // 绘制终点旗帜
    ctx.fillStyle = '#FF0000';
    const flag = this.gameObjects.flag;
    ctx.fillRect(flag.x, flag.y, flag.width, flag.height);

    ctx.restore();
  },

  processAudioData(buffer) {
    const data = new Float32Array(buffer);
    let sum = 0;
    let maxFreq = 0;

    // 计算音量
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
    }
    const volume = sum / data.length;

    // 简单的音高检测
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[i-1]) maxFreq++;
    }
    const pitch = maxFreq / data.length;

    // 更新UI
    this.setData({
      volumeLevel: Math.min(100, volume * 200),
      pitchLevel: Math.min(100, pitch * 200)
    });

    // 控制游戏
    if (this.data.gameState === GAME_STATE.PLAYING) {
      const chicken = this.gameObjects.chicken;

      // 移动控制
      if (volume > this.data.moveThreshold) {
        chicken.velocityX = 300 * volume;
        chicken.isMoving = true;
      } else {
        chicken.velocityX *= 0.9;
        chicken.isMoving = false;
      }

      // 跳跃控制
      if (pitch > this.data.jumpThreshold && !chicken.isJumping) {
        chicken.velocityY = -500;
        chicken.isJumping = true;
      }
    }
  },

  checkCollisions() {
    const chicken = this.gameObjects.chicken;

    // 检查与平台的碰撞
    this.gameObjects.platforms.forEach(platform => {
      if (this.checkCollision(chicken, platform)) {
        // 从上方碰撞
        if (chicken.velocityY > 0 && 
            chicken.y + chicken.height - chicken.velocityY <= platform.y) {
          chicken.y = platform.y - chicken.height;
          chicken.velocityY = 0;
          chicken.isJumping = false;
        }
      }
    });

    // 防止超出边界
    if (chicken.x < 0) chicken.x = 0;
    if (chicken.x + chicken.width > this.data.gameWidth) {
      chicken.x = this.data.gameWidth - chicken.width;
    }
  },

  checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  },

  updateCamera() {
    const chicken = this.gameObjects.chicken;
    const camera = this.gameObjects.camera;

    // 相机跟随小鸡
    camera.x = chicken.x - this.data.gameWidth * 0.3;
    
    // 限制相机范围
    camera.x = Math.max(0, Math.min(camera.x, 
      this.data.gameWidth - this.data.canvasWidth));
  },

  checkWinCondition() {
    return this.checkCollision(this.gameObjects.chicken, this.gameObjects.flag);
  },

  checkLoseCondition() {
    return this.gameObjects.chicken.y > this.data.gameHeight + 100;
  },

  gameWin() {
    this.setData({
      gameState: GAME_STATE.WIN,
      showMessage: true,
      messageTitle: '恭喜过关！',
      messageContent: `用时：${Math.floor(this.data.gameTime)}秒\n距离：${Math.floor(this.data.distance)}米`,
      messageButtonText: '再玩一次'
    });
    this.stopGame();
  },

  gameLose() {
    this.setData({
      gameState: GAME_STATE.LOSE,
      showMessage: true,
      messageTitle: '游戏结束',
      messageContent: '小鸡掉下去了！',
      messageButtonText: '重新开始'
    });
    this.stopGame();
  },

  stopGame() {
    if (this.systems.frameTimer) {
      cancelAnimationFrame(this.systems.frameTimer);
    }
    if (this.systems.recorder) {
      this.systems.recorder.stop();
    }
  },

  handleMessageButton() {
    if (this.data.gameState === GAME_STATE.WIN || 
        this.data.gameState === GAME_STATE.LOSE) {
      this.setData({ gameState: GAME_STATE.READY });
      this.initGameObjects();
      this.startGame();
    }
  },

  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  onUnload() {
    this.stopGame();
  }
});
