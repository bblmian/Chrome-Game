# 小鸡闯关

一个基于网页的声控小游戏，通过声音控制小鸡移动和跳跃。

## 游戏特点

- 使用声音控制游戏角色
  - 声音越大，移动速度越快
  - 音调越高，跳跃越高
  - 持续发声可以延长跳跃时间
- 实时摄像头背景
- 游戏录像功能
- 流畅的物理效果和动画

## 技术特点

- 纯原生JavaScript实现，无需任何框架
- 模块化的代码结构
- 使用Web Audio API进行声音分析
- 使用Canvas进行游戏渲染
- 使用MediaRecorder API录制游戏视频

## 如何运行

1. 克隆仓库
```bash
git clone https://github.com/yourusername/voice-controlled-game.git
```

2. 使用本地服务器运行（比如Python的SimpleHTTPServer）
```bash
# Python 3
python -m http.server 8000
```

3. 在浏览器中访问
```
http://localhost:8000
```

## 游戏控制

- 发出声音：向前移动（声音越大，移动越快）
- 发出高音：跳跃（音调越高，跳得越高）
- 持续发声：延长跳跃时间

## 系统要求

- 现代浏览器（支持Web Audio API和MediaRecorder API）
- 麦克风
- 摄像头

## 项目结构

```
.
├── assets/             # 游戏资源文件
├── css/               # 样式文件
├── js/                # JavaScript源代码
│   ├── audio/        # 音频处理相关
│   ├── core/         # 游戏核心逻辑
│   ├── physics/      # 物理引擎
│   ├── sprites/      # 游戏精灵
│   └── utils/        # 工具函数
└── index.html        # 游戏入口文件
```

## 开发说明

### 音频处理

游戏使用Web Audio API分析音频输入：
- 音量用于控制移动速度
- 音高用于触发跳跃
- 实时音频分析确保响应及时

### 物理系统

包含基本的2D物理系统：
- 重力
- 碰撞检测
- 平台交互

### 渲染系统

使用Canvas进行游戏渲染：
- 摄像头背景
- 精灵动画
- 视差滚动
- UI元素

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- 游戏中使用的精灵图片和音效资源
- Web Audio API 和 MediaRecorder API 的开发文档
- 所有为这个项目做出贡献的开发者
