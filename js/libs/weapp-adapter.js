const global = GameGlobal

const document = {
    createElement(tagName) {
        if (tagName === 'canvas') {
            return wx.createCanvas()
        } else if (tagName === 'audio') {
            return wx.createInnerAudioContext()
        }
        return null
    },
    createElementNS(ns, tagName) {
        return this.createElement(tagName)
    }
}

const window = {
    document,
    canvas: wx.createCanvas(),
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    requestAnimationFrame: callback => {
        return setTimeout(callback, 1000 / 60)
    },
    cancelAnimationFrame: id => {
        return clearTimeout(id)
    },
    location: {
        href: 'game.js'
    },
    localStorage: {
        getItem(key) {
            return wx.getStorageSync(key)
        },
        setItem(key, value) {
            wx.setStorageSync(key, value)
        },
        removeItem(key) {
            wx.removeStorageSync(key)
        },
        clear() {
            wx.clearStorageSync()
        }
    },
    WebGLRenderingContext: {},
    AudioContext: function() {
        return wx.createWebAudioContext()
    },
    Image: function() {
        const image = wx.createImage()
        return image
    },
    TouchEvent: class TouchEvent {
        constructor(type, options = {}) {
            this.type = type
            this.touches = options.touches || []
            this.changedTouches = options.changedTouches || []
            this.timeStamp = options.timeStamp || Date.now()
        }
    }
}

// 将window对象的属性复制到全局
Object.keys(window).forEach(key => {
    if (key !== 'document') {  // 跳过document属性
        global[key] = window[key]
    }
})

// 设置全局window
global.window = window

export default window
export {
    canvas,
    document,
    TouchEvent
}
