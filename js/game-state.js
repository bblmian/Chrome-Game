class GameState {
    constructor() {
        // Game states
        this.states = {
            MENU: 'MENU',
            PLAYING: 'PLAYING',
            WIN: 'WIN',
            LOSE: 'LOSE',
            ERROR: 'ERROR'
        };
        
        // Current state
        this.currentState = this.states.MENU;
        
        // Game stats
        this.gameTime = 0;
        this.gameDistance = 0;
        
        // Movement flags
        this.isMoving = false;
        this.isJumping = false;
        
        // Debug logging
        this.debug = document.getElementById('debug');
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    reset() {
        this.log('重置游戏状态');
        this.gameTime = 0;
        this.gameDistance = 0;
        this.isMoving = false;
        this.isJumping = false;
        this.currentState = this.states.MENU;
    }

    setState(state) {
        if (this.states[state]) {
            const oldState = this.currentState;
            this.currentState = this.states[state];
            this.log(`游戏状态改变: ${oldState} -> ${this.currentState}`);
            
            // Handle state change
            if (state === 'PLAYING') {
                this.reset();
                this.currentState = this.states.PLAYING;
            } else if (state === 'WIN' || state === 'LOSE') {
                if (window.onGameEnd) {
                    window.onGameEnd();
                }
            }
        } else {
            this.log(`错误: 无效的游戏状态 ${state}`);
        }
    }

    isState(state) {
        return this.currentState === this.states[state];
    }

    getState() {
        return this.currentState;
    }

    updateTime(deltaTime) {
        if (this.isState('PLAYING')) {
            this.gameTime += deltaTime;
        }
    }

    updateDistance(x) {
        if (this.isState('PLAYING')) {
            this.gameDistance = Math.max(this.gameDistance, Math.floor(x / 100));
        }
    }

    getGameTimeText() {
        return `时间: ${Math.floor(this.gameTime)}秒`;
    }

    getGameDistanceText() {
        return `距离: ${Math.floor(this.gameDistance)}米`;
    }

    getGameOverText() {
        const status = this.isState('WIN') ? '恭喜通关' : '游戏结束';
        return `${status}！前进了 ${Math.floor(this.gameDistance)} 米`;
    }

    getState() {
        return {
            state: this.currentState,
            time: this.gameTime,
            distance: this.gameDistance,
            isMoving: this.isMoving,
            isJumping: this.isJumping
        };
    }
}

// Make GameState available globally
window.GameState = GameState;
