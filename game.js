// 获取游戏画布
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

// 设置画布大小
const aspectRatio = 16 / 9
const maxWidth = window.innerWidth
const maxHeight = window.innerHeight
let gameWidth, gameHeight

if (maxWidth / maxHeight > aspectRatio) {
    gameHeight = maxHeight
    gameWidth = gameHeight * aspectRatio
} else {
    gameWidth = maxWidth
    gameHeight = gameWidth / aspectRatio
}

canvas.width = gameWidth
canvas.height = gameHeight

// 加载图片资源
const chickenImage = new Image()
chickenImage.src = 'assets/chicken_2.png'

const bannerImage = new Image()
bannerImage.src = 'assets/banner.png'

// 游戏状态
const GAME_STATE = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WIN: 'win',
  LOSE: 'lose'
}

// 游戏配置
const CONFIG = {
  moveThreshold: 0.15,
  jumpThreshold: 0.2,
  fps: 60,
  gravity: 980,
  chickenSpeed: 300,
  jumpForce: -500,
  platformHeight: 40,
  oceanHeight: 100,  // 海洋高度
  platformGap: 200   // 平台之间的间距
}

class Game {
  constructor() {
    this.canvas = canvas
    this.ctx = ctx
    this.state = GAME_STATE.READY
    this.gameObjects = {
      chicken: null,
      platforms: [],
      flag: null,
      camera: null
    }
    this.systems = {
      audioContext: null,
      mediaRecorder: null,
      frameTimer: null,
      lastFrameTime: 0,
      videoStream: null
    }
    this.data = {
      gameTime: 0,
      distance: 0,
      volumeLevel: 0,
      pitchLevel: 0
    }

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onHide()
      } else {
        this.onShow()
      }
    })

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this))

    // 初始化游戏
    this.init()
  }

  handleResize() {
    // 重新计算画布大小
    const maxWidth = window.innerWidth
    const maxHeight = window.innerHeight

    if (maxWidth / maxHeight > aspectRatio) {
      gameHeight = maxHeight
      gameWidth = gameHeight * aspectRatio
    } else {
      gameWidth = maxWidth
      gameHeight = gameWidth / aspectRatio
    }

    canvas.width = gameWidth
    canvas.height = gameHeight

    // 重新渲染
    if (this.state === GAME_STATE.PLAYING) {
      this.render()
    } else {
      this.showStartUI()
    }
  }

  async init() {
    try {
      await this.initCamera()
      await this.initAudio()
      this.initGameObjects()
      this.bindEvents()
      this.showStartUI()
    } catch (error) {
      console.error('Game initialization failed:', error)
      this.showPermissionDialog()
    }
  }

  showPermissionDialog() {
    const dialog = document.getElementById('permissionDialog')
    dialog.style.display = 'block'
  }

  async requestPermissions() {
    try {
      await this.initCamera()
      await this.initAudio()
      document.getElementById('permissionDialog').style.display = 'none'
    } catch (error) {
      console.error('Permission request failed:', error)
    }
  }

  async initCamera() {
    try {
      // 获取摄像头流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: gameWidth },
          height: { ideal: gameHeight }
        }
      })

      // 设置视频预览
      const video = document.getElementById('cameraPreview')
      video.srcObject = stream
      this.systems.videoStream = stream

      console.log('Camera initialized')
    } catch (error) {
      console.error('Camera initialization failed:', error)
      throw new Error('需要相机权限')
    }
  }

  async initAudio() {
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // 获取麦克风流
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // 创建音频分析器
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      
      // 连接音频节点
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // 创建数据缓冲区
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // 存储音频系统
      this.systems.audioContext = audioContext
      this.systems.analyser = analyser
      this.systems.dataArray = dataArray

      // 开始音频分析
      this.startAudioAnalysis()

      console.log('Audio system initialized')
    } catch (error) {
      console.error('Audio initialization failed:', error)
      throw new Error('需要麦克风权限')
    }
  }

  startAudioAnalysis() {
    const analyseAudio = () => {
      if (this.state === GAME_STATE.PLAYING) {
        // 获取音频数据
        this.systems.analyser.getByteFrequencyData(this.systems.dataArray)
        
        // 计算音量和音高
        let volume = 0
        let pitch = 0
        const data = this.systems.dataArray
        
        // 计算音量（使用频域数据的平均值）
        for (let i = 0; i < data.length; i++) {
          volume += data[i]
        }
        volume = volume / data.length / 255  // 归一化到0-1

        // 计算音高（使用最大能量的频率）
        let maxValue = 0
        let maxIndex = 0
        for (let i = 0; i < data.length; i++) {
          if (data[i] > maxValue) {
            maxValue = data[i]
            maxIndex = i
          }
        }
        pitch = maxIndex / data.length  // 归一化到0-1

        // 更新游戏数据
        this.data.volumeLevel = volume
        this.data.pitchLevel = pitch

        // 控制游戏
        const chicken = this.gameObjects.chicken

        // 移动控制
        if (volume > CONFIG.moveThreshold) {
          chicken.velocityX = CONFIG.chickenSpeed * volume
          chicken.isMoving = true
        } else {
          chicken.velocityX *= 0.9
          chicken.isMoving = false
        }

        // 跳跃控制
        if (pitch > CONFIG.jumpThreshold && !chicken.isJumping) {
          chicken.velocityY = CONFIG.jumpForce
          chicken.isJumping = true
        }
      }

      // 继续分析
      requestAnimationFrame(analyseAudio)
    }

    // 开始分析
    analyseAudio()
  }

  initGameObjects() {
    // 初始化小鸡
    this.gameObjects.chicken = {
      x: 100,
      y: gameHeight - CONFIG.platformHeight - 40,  // 40是小鸡高度
      width: 40,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isMoving: false
    }

    // 初始化平台
    this.gameObjects.platforms = []
    
    // 添加起始平台
    this.gameObjects.platforms.push({
      x: 0,
      y: gameHeight - CONFIG.platformHeight - CONFIG.oceanHeight,
      width: 300,
      height: CONFIG.platformHeight
    })

    // 添加更多平台
    let lastX = 300
    for (let i = 0; i < 10; i++) {
      const platform = {
        x: lastX + CONFIG.platformGap + Math.random() * 100,
        y: gameHeight - CONFIG.platformHeight - CONFIG.oceanHeight - Math.random() * 100,
        width: 100 + Math.random() * 200,
        height: CONFIG.platformHeight
      }
      this.gameObjects.platforms.push(platform)
      lastX = platform.x + platform.width
    }

    // 初始化终点旗帜
    const lastPlatform = this.gameObjects.platforms[this.gameObjects.platforms.length - 1]
    this.gameObjects.flag = {
      x: lastPlatform.x + lastPlatform.width - 40,
      y: lastPlatform.y - 80,
      width: 40,
      height: 80
    }

    // 初始化相机
    this.gameObjects.camera = {
      x: 0,
      y: 0
    }

    console.log('Game objects initialized')
  }

  bindEvents() {
    // 触摸事件
    canvas.addEventListener('touchstart', () => {
      if (this.state === GAME_STATE.READY) {
        this.startGame()
      }
    })

    // 鼠标事件（用于桌面端测试）
    canvas.addEventListener('click', () => {
      if (this.state === GAME_STATE.READY) {
        this.startGame()
      }
    })
  }

  onShow() {
    // 游戏恢复时的处理
    if (this.state === GAME_STATE.PLAYING) {
      this.startGameLoop()
    }
  }

  onHide() {
    // 游戏暂停时的处理
    if (this.state === GAME_STATE.PLAYING) {
      if (this.systems.frameTimer) {
        cancelAnimationFrame(this.systems.frameTimer)
      }
    }
  }

  startGame() {
    if (this.state !== GAME_STATE.READY) return

    // 开始游戏循环
    this.startGameLoop()

    this.state = GAME_STATE.PLAYING
    this.data.gameTime = 0
    this.data.distance = 0

    console.log('Game started')
  }

  startGameLoop() {
    const loop = () => {
      const now = Date.now()
      const deltaTime = (now - this.systems.lastFrameTime) / 1000
      this.systems.lastFrameTime = now

      if (this.state === GAME_STATE.PLAYING) {
        this.update(deltaTime)
        this.render()
      }

      this.systems.frameTimer = requestAnimationFrame(loop)
    }

    this.systems.lastFrameTime = Date.now()
    loop()
  }

  update(deltaTime) {
    // 更新游戏时间
    this.data.gameTime += deltaTime

    // 更新小鸡位置
    const chicken = this.gameObjects.chicken
    
    // 应用重力
    chicken.velocityY += CONFIG.gravity * deltaTime
    
    // 更新位置
    chicken.x += chicken.velocityX * deltaTime
    chicken.y += chicken.velocityY * deltaTime

    // 碰撞检测
    this.checkCollisions()

    // 检查胜利条件
    if (this.checkWinCondition()) {
      this.gameWin()
    }

    // 检查失败条件
    if (this.checkLoseCondition()) {
      this.gameLose()
    }

    // 更新相机位置
    this.updateCamera()

    // 更新距离
    this.data.distance = Math.max(0, chicken.x - 100)
  }

  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, gameWidth, gameHeight)

    // 绘制海洋
    this.ctx.fillStyle = '#4169E1'  // 深蓝色
    this.ctx.fillRect(
      this.gameObjects.camera.x,
      gameHeight - CONFIG.oceanHeight,
      gameWidth,
      CONFIG.oceanHeight
    )

    // 应用相机变换
    this.ctx.save()
    this.ctx.translate(-this.gameObjects.camera.x, -this.gameObjects.camera.y)

    // 绘制平台
    this.gameObjects.platforms.forEach(platform => {
      // 绘制平台背景
      this.ctx.drawImage(
        bannerImage,
        platform.x,
        platform.y,
        platform.width,
        platform.height
      )
    })

    // 绘制小鸡
    const chicken = this.gameObjects.chicken
    this.ctx.drawImage(
      chickenImage,
      chicken.x,
      chicken.y,
      chicken.width,
      chicken.height
    )

    // 绘制终点旗帜
    this.ctx.fillStyle = '#FF0000'
    const flag = this.gameObjects.flag
    this.ctx.fillRect(flag.x, flag.y, flag.width, flag.height)

    this.ctx.restore()

    // 绘制UI
    this.renderUI()
  }

  renderUI() {
    // 绘制音量条
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(20, 20, 30, 150)
    
    this.ctx.fillStyle = '#4CAF50'
    const volumeHeight = 150 * this.data.volumeLevel
    this.ctx.fillRect(20, 170 - volumeHeight, 30, volumeHeight)

    // 绘制游戏数据
    this.ctx.fillStyle = 'white'
    this.ctx.font = '20px Arial'
    this.ctx.fillText(`时间: ${Math.floor(this.data.gameTime)}秒`, 70, 30)
    this.ctx.fillText(`距离: ${Math.floor(this.data.distance)}米`, 70, 60)
  }

  checkCollisions() {
    const chicken = this.gameObjects.chicken

    // 检查与平台的碰撞
    let onPlatform = false
    this.gameObjects.platforms.forEach(platform => {
      if (this.checkCollision(chicken, platform)) {
        // 从上方碰撞
        if (chicken.velocityY > 0 && 
            chicken.y + chicken.height - chicken.velocityY <= platform.y) {
          chicken.y = platform.y - chicken.height
          chicken.velocityY = 0
          chicken.isJumping = false
          onPlatform = true
        }
      }
    })

    // 如果不在任何平台上且不在跳跃中
    if (!onPlatform && !chicken.isJumping) {
      chicken.isJumping = true
    }

    // 防止超出边界
    if (chicken.x < 0) chicken.x = 0
  }

  checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y
  }

  updateCamera() {
    const chicken = this.gameObjects.chicken
    
    // 相机跟随小鸡
    this.gameObjects.camera.x = Math.max(0, 
      chicken.x - gameWidth * 0.3)
  }

  checkWinCondition() {
    return this.checkCollision(this.gameObjects.chicken, this.gameObjects.flag)
  }

  checkLoseCondition() {
    return this.gameObjects.chicken.y > gameHeight - CONFIG.oceanHeight
  }

  gameWin() {
    this.state = GAME_STATE.WIN
    this.stopGame()
    this.showResult('恭喜过关！', true)
  }

  gameLose() {
    this.state = GAME_STATE.LOSE
    this.stopGame()
    this.showResult('游戏结束', false)
  }

  stopGame() {
    if (this.systems.frameTimer) {
      cancelAnimationFrame(this.systems.frameTimer)
    }
  }

  showStartUI() {
    // 绘制开始界面
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, gameWidth, gameHeight)

    this.ctx.fillStyle = 'white'
    this.ctx.font = '30px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('点击屏幕开始游戏', gameWidth/2, gameHeight/2)

    this.ctx.font = '20px Arial'
    this.ctx.fillText('发出声音移动 - 音量控制速度', gameWidth/2, gameHeight/2 + 40)
    this.ctx.fillText('发出高音跳跃 - 音调控制高度', gameWidth/2, gameHeight/2 + 70)
  }

  showResult(title, isWin) {
    // 绘制结果界面
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, gameWidth, gameHeight)

    this.ctx.fillStyle = isWin ? '#4CAF50' : '#F44336'
    this.ctx.font = '30px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(title, gameWidth/2, gameHeight/2 - 40)

    this.ctx.fillStyle = 'white'
    this.ctx.font = '20px Arial'
    this.ctx.fillText(
      `用时：${Math.floor(this.data.gameTime)}秒  距离：${Math.floor(this.data.distance)}米`,
      gameWidth/2, 
      gameHeight/2
    )

    this.ctx.fillText('点击屏幕重新开始', gameWidth/2, gameHeight/2 + 40)
  }
}

// 等待页面加载完成
window.addEventListener('load', () => {
  // 等待图片加载
  Promise.all([
    new Promise(resolve => chickenImage.onload = resolve),
    new Promise(resolve => bannerImage.onload = resolve)
  ]).then(() => {
    // 启动游戏
    window.game = new Game()
  })
})

// 导出requestPermissions函数供HTML使用
window.requestPermissions = async () => {
  if (window.game) {
    await window.game.requestPermissions()
  }
}
