// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    const debug = document.getElementById('debug');

    function log(message, type = 'info') {
        console.log(message);
        if (debug) {
            const time = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : 
                         type === 'warn' ? 'orange' : 
                         'white';
            debug.innerHTML = `<span style="color: ${color}">${time} - ${message}</span>\n` + 
                            debug.innerHTML;
        }
    }

    // Verify required elements
    const startButton = document.getElementById('startButton');
    const downloadButton = document.getElementById('downloadButton');
    const canvas = document.getElementById('gameCanvas');

    if (!startButton || !downloadButton || !canvas) {
        log('Required UI elements not found', 'error');
        return;
    }

    // Verify required classes
    const requiredClasses = [
        'Game', 'GameCore', 'GameManager', 'GameLoop',
        'GameState', 'GameRenderer', 'GameBackground',
        'Sprite', 'Platform', 'Flag', 'Chicken',
        'AudioController', 'AudioProcessor'
    ];

    for (const className of requiredClasses) {
        if (typeof window[className] === 'undefined') {
            log(`Required class ${className} not found`, 'error');
            return;
        }
    }

    // Initialize game
    let game = null;
    try {
        log('初始化游戏...');
        game = new Game();
        window.game = game;
        log('游戏初始化成功');
    } catch (error) {
        log(`游戏初始化错误: ${error.message}`, 'error');
        console.error(error);
        startButton.disabled = true;
        return;
    }

    // Start button click handler
    startButton.onclick = async function(e) {
        e.preventDefault();
        log('开始按钮被点击');
        
        if (!game) {
            log('错误: 游戏实例未找到', 'error');
            return;
        }

        try {
            // Disable buttons during initialization
            startButton.disabled = true;
            downloadButton.disabled = true;

            // Request permissions
            log('请求权限...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        width: canvas.width,
                        height: canvas.height,
                        facingMode: 'user'
                    }
                });
                log('权限获取成功');
            } catch (error) {
                if (error.name === 'NotAllowedError') {
                    throw new Error('需要麦克风和摄像头权限才能玩游戏。请允许权限后重试。');
                } else if (error.name === 'NotFoundError') {
                    throw new Error('未检测到麦克风或摄像头。请确保设备已正确连接。');
                } else if (error.name === 'NotReadableError') {
                    throw new Error('无法访问麦克风或摄像头。请确保没有其他程序正在使用这些设备。');
                } else {
                    throw new Error(`设备访问错误: ${error.message}`);
                }
            }

            // Initialize audio
            log('初始化音频...');
            if (!window.audioController) {
                throw new Error('音频控制器未找到');
            }
            await window.audioController.initialize(stream);

            // Start game
            log('启动游戏...');
            await game.handleStartClick();
            log('游戏启动成功');

        } catch (error) {
            log(`游戏启动错误: ${error.message}`, 'error');
            console.error(error);
            
            // Show user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '20px';
            errorDiv.style.borderRadius = '10px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '1000';
            errorDiv.innerHTML = `
                <h3>游戏启动失败</h3>
                <p>${error.message}</p>
                <button onclick="this.parentElement.remove()" style="
                    background: #4CAF50;
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                ">确定</button>
            `;
            document.body.appendChild(errorDiv);

            // Re-enable start button
            startButton.disabled = false;
        }
    };

    // Download button click handler
    downloadButton.onclick = async function(e) {
        e.preventDefault();
        log('下载按钮被点击');
        
        if (!game || !game.manager) {
            log('错误: 游戏管理器未找到', 'error');
            return;
        }

        try {
            // Let the game manager handle the download
            game.manager.handleDownload();
        } catch (error) {
            log(`下载录像错误: ${error.message}`, 'error');
            console.error(error);
        }
    };

    // Game end handler
    window.onGameEnd = function() {
        log('游戏结束');
        startButton.disabled = false;
    };

    // Space key handler
    document.onkeydown = function(e) {
        if (e.code === 'Space' && !startButton.disabled) {
            log('空格键被按下');
            startButton.click();
        }
    };

    log('事件监听器已设置');
});
