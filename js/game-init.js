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
    const gameContainer = document.querySelector('.game-container');

    if (!startButton || !downloadButton || !canvas || !gameContainer) {
        log('Required UI elements not found', 'error');
        return;
    }

    // Function to update canvas size
    function updateCanvasSize() {
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;
        
        // Set canvas size maintaining 2:1 aspect ratio
        canvas.width = containerWidth;
        canvas.height = containerWidth * 0.5; // 2:1 ratio

        // Update game rendering if game exists
        if (window.game && window.game.manager) {
            window.game.manager.handleResize(canvas.width, canvas.height);
        }

        log(`Canvas resized to ${canvas.width}x${canvas.height}`);
    }

    // Set initial canvas size
    updateCanvasSize();

    // Add resize event listener
    let resizeTimeout;
    window.addEventListener('resize', function() {
        // Debounce resize event
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateCanvasSize, 250);
    });

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

            // Start game through game instance
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

    // Handle orientation change for mobile devices
    window.addEventListener('orientationchange', function() {
        setTimeout(updateCanvasSize, 300); // Wait for orientation change to complete
    });

    log('事件监听器已设置');
});
