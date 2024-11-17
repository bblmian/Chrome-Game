// 获取应用实例
const app = getApp();

Page({
  data: {
    hasVideo: false,
    gameStarted: false,
    cameraReady: false,
    recorderManager: null,
    audioContext: null,
    gameCanvas: null,
    gameContext: null,
    cameraContext: null,
    frameTimer: null,
    recordingVideo: false
  },

  onLoad() {
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager();
    this.setupRecorderListeners();

    // 初始化音频上下文
    this.audioContext = wx.createWebAudioContext();

    // 获取系统信息以设置画布尺寸
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          canvasWidth: res.windowWidth,
          canvasHeight: res.windowWidth / 2 // 保持2:1的宽高比
        });
      }
    });
  },

  onReady() {
    this.initCanvas();
    this.initCamera();
  },

  async initCanvas() {
    try {
      const query = wx.createSelectorQuery();
      query.select('#gameCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node;
          const context = canvas.getContext('2d');
          
          // 设置画布尺寸
          canvas.width = this.data.canvasWidth;
          canvas.height = this.data.canvasHeight;

          this.gameCanvas = canvas;
          this.gameContext = context;

          console.log('Canvas initialized');
        });
    } catch (error) {
      console.error('Canvas initialization failed:', error);
    }
  },

  initCamera() {
    try {
      this.cameraContext = wx.createCameraContext();
      this.setData({ cameraReady: true });
      console.log('Camera initialized');
    } catch (error) {
      console.error('Camera initialization failed:', error);
      wx.showToast({
        title: '相机初始化失败',
        icon: 'none'
      });
    }
  },

  setupRecorderListeners() {
    // 录音开始事件
    this.recorderManager.onStart(() => {
      console.log('Recorder started');
    });

    // 录音结束事件
    this.recorderManager.onStop((res) => {
      console.log('Recorder stopped', res);
    });

    // 录音错误事件
    this.recorderManager.onError((error) => {
      console.error('Recorder error:', error);
    });

    // 录音帧数据可用事件
    this.recorderManager.onFrameRecorded((res) => {
      const { frameBuffer, isLastFrame } = res;
      if (frameBuffer) {
        // 处理音频帧数据
        this.processAudioData(frameBuffer);
      }
    });
  },

  processAudioData(buffer) {
    // 计算音量
    let sum = 0;
    const data = new Float32Array(buffer);
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
    }
    const volume = sum / data.length;

    // 更新游戏状态
    if (this.data.gameStarted) {
      // TODO: 根据音量控制游戏
      console.log('Volume:', volume);
    }
  },

  async startGame() {
    try {
      // 检查权限
      const cameraAuth = await wx.authorize({ scope: 'scope.camera' });
      const recordAuth = await wx.authorize({ scope: 'scope.record' });

      if (!cameraAuth || !recordAuth) {
        throw new Error('需要相机和麦克风权限');
      }

      // 开始录音
      this.recorderManager.start({
        duration: 60000, // 最长录音时间
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'pcm',
        frameSize: 1
      });

      // 开始游戏循环
      this.startGameLoop();

      this.setData({ gameStarted: true });
      console.log('Game started');

    } catch (error) {
      console.error('Game start failed:', error);
      wx.showToast({
        title: error.message || '游戏启动失败',
        icon: 'none'
      });
    }
  },

  startGameLoop() {
    // 清除现有的定时器
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
    }

    // 创建新的游戏循环
    this.frameTimer = setInterval(() => {
      if (this.data.gameStarted) {
        this.updateGame();
        this.renderGame();
      }
    }, 1000 / 60); // 60fps
  },

  updateGame() {
    // TODO: 更新游戏状态
  },

  renderGame() {
    if (!this.gameContext) return;

    // 清空画布
    this.gameContext.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);

    // TODO: 渲染游戏元素
  },

  shareVideo() {
    if (!this.data.hasVideo) return;

    wx.shareVideoMessage({
      videoPath: this.videoPath,
      success: () => {
        console.log('Video shared successfully');
      },
      fail: (error) => {
        console.error('Video share failed:', error);
        wx.showToast({
          title: '视频分享失败',
          icon: 'none'
        });
      }
    });
  },

  onUnload() {
    // 清理资源
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
    }
    if (this.recorderManager) {
      this.recorderManager.stop();
    }
    if (this.data.gameStarted) {
      this.setData({ gameStarted: false });
    }
  }
});
