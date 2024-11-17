class GameInput {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;

        // 键盘事件
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // 触摸事件
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // 防止移动端浏览器的默认行为（如滚动、缩放）
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    }

    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // 处理跳跃
        if (event.code === 'Space' && !this.game.chicken.isJumping) {
            this.game.chicken.jump();
        }
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
    }

    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isTouching = true;

        // 处理跳跃
        if (!this.game.chicken.isJumping) {
            this.game.chicken.jump();
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (!this.isTouching) return;

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        
        // 模拟左右键
        if (deltaX < -30) {
            this.keys['ArrowLeft'] = true;
            this.keys['ArrowRight'] = false;
        } else if (deltaX > 30) {
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = true;
        } else {
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        }

        this.touchStartX = touch.clientX;
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.isTouching = false;
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
    }

    update() {
        // 处理移动
        if (this.keys['ArrowLeft']) {
            this.game.chicken.moveLeft();
        }
        if (this.keys['ArrowRight']) {
            this.game.chicken.moveRight();
        }
    }
}
