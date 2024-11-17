// 微信小游戏适配器
export default class WeappAdapter {
  constructor() {
    this.canvas = wx.createCanvas()
    this.initWebAudio()
    this.initDocument()
    this.initWindow()
  }

  initWebAudio() {
    // Web Audio API适配
    if (!window.AudioContext) {
      window.AudioContext = function() {
        return wx.createWebAudioContext()
      }
    }
  }

  initDocument() {
    // Document对象适配
    if (!window.document) {
      window.document = {
        createElement(tagName) {
          if (tagName === 'canvas') {
            return wx.createCanvas()
          }
          if (tagName === 'audio') {
            return wx.createInnerAudioContext()
          }
          return null
        },
        createElementNS(ns, tagName) {
          return this.createElement(tagName)
        }
      }
    }
  }

  initWindow() {
    // Window对象适配
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = callback => {
        return setTimeout(callback, 1000 / 60)
      }
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = id => {
        clearTimeout(id)
      }
    }

    // 事件对象适配
    if (!window.TouchEvent) {
      window.TouchEvent = class TouchEvent {
        constructor(type, options = {}) {
          this.type = type
          this.touches = options.touches || []
          this.changedTouches = options.changedTouches || []
          this.timeStamp = options.timeStamp || Date.now()
        }
      }
    }
  }
}

// 初始化适配器
new WeappAdapter()

// 导出全局对象
export const canvas = wx.createCanvas()
export const TouchEvent = window.TouchEvent
