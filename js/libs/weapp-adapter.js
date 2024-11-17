// 创建全局window对象
const global = GameGlobal

function inject() {
    const window = {
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
        document: {
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
        global[key] = window[key]
    })

    // 将window对象设置为全局对象
    global.window = window
    window.window = window

    return window
}

// 执行注入
const window = inject()

// 导出全局对象
export default window
export const canvas = window.canvas
export const document = window.document
export const localStorage = window.localStorage
export const TouchEvent = window.TouchEvent
