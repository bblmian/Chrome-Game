class Camera {
    constructor(canvas, levelLength) {
        if (!canvas) {
            throw new Error('Canvas is required for Camera');
        }
        this.canvas = canvas;
        this.levelLength = levelLength;
        
        // Camera position
        this.x = 0;
        this.y = 0;
        
        // Target position for smooth following
        this.targetX = 0;
        this.targetY = 0;
        
        // Camera bounds
        this.minX = 0;
        this.maxX = levelLength - canvas.width;
        this.minY = 0;
        this.maxY = canvas.height * 0.5;
        
        // Camera settings
        this.followOffsetX = canvas.width * 0.3;  // Keep player at 30% from left
        this.followOffsetY = canvas.height * 0.5;  // Keep player vertically centered
        this.horizontalSmoothing = 0.1;  // Horizontal movement smoothing
        this.verticalSmoothing = 0.15;   // Vertical movement smoothing
        this.deadzone = {
            x: 10,  // Horizontal deadzone
            y: 30   // Vertical deadzone
        };
        
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
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }

    update(target) {
        if (!target) return;

        // Calculate desired camera position (keeping player at follow offset)
        const desiredX = target.x - this.followOffsetX;
        const desiredY = target.y - this.followOffsetY;

        // Only update target if change is significant (outside deadzone)
        if (Math.abs(desiredX - this.targetX) > this.deadzone.x) {
            this.targetX = desiredX;
        }
        if (Math.abs(desiredY - this.targetY) > this.deadzone.y) {
            this.targetY = desiredY;
        }

        // Smooth camera movement
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        // Apply smoothing based on distance
        this.x += dx * this.horizontalSmoothing;
        this.y += dy * this.verticalSmoothing;

        // Clamp camera position to level bounds
        this.x = Math.max(this.minX, Math.min(this.x, this.maxX));
        this.y = Math.max(this.minY, Math.min(this.y, this.maxY));

        // Log camera position occasionally for debugging
        if (Math.random() < 0.01) {
            this.log(`摄像机位置: (${Math.round(this.x)}, ${Math.round(this.y)}), ` +
                     `目标: (${Math.round(this.targetX)}, ${Math.round(this.targetY)})`);
        }
    }

    applyTransform(ctx) {
        if (!ctx) {
            throw new Error('Context is required for camera transform');
        }
        
        ctx.save();
        
        // Round camera position to prevent subpixel rendering
        const roundedX = Math.round(this.x);
        const roundedY = Math.round(this.y);
        
        // Apply camera transform
        ctx.translate(-roundedX, -roundedY);
    }

    restoreTransform(ctx) {
        if (!ctx) {
            throw new Error('Context is required for camera transform');
        }
        ctx.restore();
    }

    isInView(object, padding = 50) {
        if (!object) return false;

        // Add padding to view bounds for smoother object loading/unloading
        return (
            object.x + object.width > this.x - padding &&
            object.x < this.x + this.canvas.width + padding &&
            object.y + object.height > this.y - padding &&
            object.y < this.y + this.canvas.height + padding
        );
    }

    getViewBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.canvas.width,
            height: this.canvas.height,
            left: this.x,
            right: this.x + this.canvas.width,
            top: this.y,
            bottom: this.y + this.canvas.height
        };
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    getState() {
        return {
            position: { x: this.x, y: this.y },
            target: { x: this.targetX, y: this.targetY },
            bounds: this.getViewBounds()
        };
    }
}

window.Camera = Camera;
