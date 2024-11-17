// 首先导入适配器
import { canvas, document } from './js/libs/weapp-adapter'
import './js/libs/symbol'

const ctx = canvas.getContext('2d')
const gameWidth = canvas.width
const gameHeight = canvas.height

// 创建视频元素
const video = wx.createVideo({
  x: 0,
  y: 0,
  width: gameWidth,
  height: gameHeight,
  objectFit: 'cover',
  devicePosition: 'front',
  live: true,
  muted: true
})

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
  jumpForce: -500
}

class Game {
  constructor() {
    this.canvas = canvas
    this.ctx = ctx
    this.video = video
    this.state = GAME_STATE.READY
    this.gameObjects = {
      chicken: null,
      platforms: [],
      flag: null,
      camera: null
    }
    this.systems = {
      recorder: null,
      frameTimer: null,
      lastFrameTime: 0
    }
    this.data = {
      gameTime: 0,
      distance: 0,
      volumeLevel: 0,
      pitchLevel: 0
    }

    // 启动游戏
    wx.onShow(() => {
      this.init()
    })
  }

  async init() {
    try {
      await this.initVideo()
      await this.initAudio()
      this.initGameObjects()
      this.bindEvents()
      this.showStartUI()
    } catch (error) {
      console.error('Game initialization failed:', error)
      wx.showToast({
        title: '游戏初始化失败',
        icon: 'none'
      })
    }
  }

  async initVideo() {
    try {
      // 检查相机权限
      await wx.authorize({ scope: 'scope.camera' })

      // 启动视频预览
      this.video.play()

      // 监听视频错误
      this.video.onError((err) => {
        console.error('Video error:', err)
      })

      console.log('Video initialized')
    } catch (error) {
      console.error('Video initialization failed:', error)
      throw new Error('需要相机权限')
    }
  }

  async initAudio() {
    try {
      // 检查录音权限
      await wx.authorize({ scope: 'scope.record' })
      
      // 创建录音管理器
      const recorderManager = wx.getRecorderManager()
      
      // 设置录音参数
      const recorderConfig = {
        duration: 600000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'pcm',
        frameSize: 1
      }

      // 录音事件处理
      recorderManager.onStart(() => {
        console.log('Recording started')
      })

      recorderManager.onError((error) => {
        console.error('Recording error:', error)
      })

      recorderManager.onFrameRecorded((res) => {
        const { frameBuffer } = res
        if (frameBuffer) {
          this.processAudioData(frameBuffer)
        }
      })

      this.systems.recorder = recorderManager
      this.recorderConfig = recorderConfig
      console.log('Audio system initialized')
    } catch (error) {
      console.error('Audio initialization failed:', error)
      throw new Error('需要麦克风权限')
    }
  }

  initGameObjects() {
    // 初始化小鸡
    this.gameObjects.chicken = {
      x: 100,
      y: gameHeight - 100,
      width: 40,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isMoving: false
    }

    // 初始化平台
    this.gameObjects.platforms = [
      { x: 0, y: gameHeight - 40, width: gameWidth, height: 40 }
      // 添加更多平台...
    ]

    // 初始化终点旗帜
    this.gameObjects.flag = {
      x: gameWidth - 100,
      y: gameHeight - 120,
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
    wx.onTouchStart(() => {
      if (this.state === GAME_STATE.READY) {
        this.startGame()
      }
    })
  }

  startGame() {
    if (this.state !== GAME_STATE.READY) return

    // 开始录音
    this.systems.recorder.start(this.recorderConfig)

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

    // 绘制视频背景
    this.ctx.drawImage(this.video, 0, 0, gameWidth, gameHeight)

    // 应用相机变换
    this.ctx.save()
    this.ctx.translate(-this.gameObjects.camera.x, -this.gameObjects.camera.y)

    // 绘制平台
    this.ctx.fillStyle = '#333'
    this.gameObjects.platforms.forEach(platform => {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    })

    // 绘制小鸡
    this.ctx.fillStyle = '#FFD700'
    const chicken = this.gameObjects.chicken
    this.ctx.fillRect(chicken.x, chicken.y, chicken.width, chicken.height)

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

  processAudioData(buffer) {
    const data = new Float32Array(buffer)
    let sum = 0
    let maxFreq = 0

    // 计算音量
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i])
    }
    const volume = sum / data.length

    // 简单的音高检测
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[i-1]) maxFreq++
    }
    const pitch = maxFreq / data.length

    // 更新数据
    this.data.volumeLevel = Math.min(1, volume * 2)
    this.data.pitchLevel = Math.min(1, pitch * 2)

    // 控制游戏
    if (this.state === GAME_STATE.PLAYING) {
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
  }

  checkCollisions() {
    const chicken = this.gameObjects.chicken

    // 检查与平台的碰撞
    this.gameObjects.platforms.forEach(platform => {
      if (this.checkCollision(chicken, platform)) {
        // 从上方碰撞
        if (chicken.velocityY > 0 && 
            chicken.y + chicken.height - chicken.velocityY <= platform.y) {
          chicken.y = platform.y - chicken.height
          chicken.velocityY = 0
          chicken.isJumping = false
        }
      }
    })

    // 防止超出边界
    if (chicken.x < 0) chicken.x = 0
    if (chicken.x + chicken.width > gameWidth) {
      chicken.x = gameWidth - chicken.width
    }
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
    return this.gameObjects.chicken.y > gameHeight + 100
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
    if (this.systems.recorder) {
      this.systems.recorder.stop()
    }
    if (this.video) {
      this.video.stop()
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

    // 分享按钮
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }
}

// 启动游戏
new Game()
