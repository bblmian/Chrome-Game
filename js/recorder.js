class GameRecorder {
    constructor(canvas) {
        this.canvas = canvas;
        this.debug = document.getElementById('debug');
        this.chunks = [];
        this.mediaRecorder = null;
        this.isRecording = false;
        this.stream = null;
        this.recordingStartTime = 0;
        this.gameEndTime = null;
        this.postGameDelay = 1500; // 1.5s delay after game end
        this.recordedBlob = null;
        
        // Progress bar elements
        this.progressOverlay = null;
        this.progressBar = null;
        this.progressText = null;

        // 检测是否在微信浏览器中
        this.isWechat = window.isWechat;
    }

    log(message) {
        console.log(message);
        if (this.debug) {
            const time = new Date().toLocaleTimeString();
            this.debug.innerHTML = `${time} - ${message}\n` + this.debug.innerHTML;
        }
    }

    createProgressBar() {
        // Create overlay
        this.progressOverlay = document.createElement('div');
        Object.assign(this.progressOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000'
        });

        // Create progress container
        const progressContainer = document.createElement('div');
        Object.assign(progressContainer.style, {
            width: '80%',
            maxWidth: '300px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
        });

        // Create progress text
        this.progressText = document.createElement('div');
        Object.assign(this.progressText.style, {
            color: 'white',
            marginBottom: '10px',
            textAlign: 'center',
            fontSize: '16px'
        });
        this.progressText.textContent = '准备录像...';

        // Create progress bar container
        const barContainer = document.createElement('div');
        Object.assign(barContainer.style, {
            width: '100%',
            height: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            overflow: 'hidden'
        });

        // Create progress bar
        this.progressBar = document.createElement('div');
        Object.assign(this.progressBar.style, {
            width: '0%',
            height: '100%',
            backgroundColor: '#4CAF50',
            borderRadius: '10px',
            transition: 'width 0.3s ease'
        });

        // Assemble elements
        barContainer.appendChild(this.progressBar);
        progressContainer.appendChild(this.progressText);
        progressContainer.appendChild(barContainer);
        this.progressOverlay.appendChild(progressContainer);
        document.body.appendChild(this.progressOverlay);
    }

    updateProgress(progress, text) {
        if (this.progressBar && this.progressText) {
            this.progressBar.style.width = `${progress}%`;
            if (text) {
                this.progressText.textContent = text;
            }
        }
    }

    removeProgressBar() {
        if (this.progressOverlay && this.progressOverlay.parentNode) {
            this.progressOverlay.parentNode.removeChild(this.progressOverlay);
        }
        this.progressOverlay = null;
        this.progressBar = null;
        this.progressText = null;
    }

    async startRecording() {
        try {
            this.log('开始录制...');
            
            if (this.isWechat) {
                // 在微信中使用截图方式记录游戏画面
                this.startWechatRecording();
            } else {
                // 在其他浏览器中使用MediaRecorder
                this.startNormalRecording();
            }

            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.gameEndTime = null;
            this.recordedBlob = null;
            this.log('录制已开始');

        } catch (error) {
            this.log(`录制启动错误: ${error.message}`);
            console.error('Recording error:', error);
            this.isRecording = false;
        }
    }

    async startWechatRecording() {
        // 在微信中，我们使用定时截图来记录游戏画面
        this.screenshots = [];
        this.screenshotInterval = setInterval(() => {
            const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
            this.screenshots.push(dataUrl);
            
            // 限制截图数量，防止内存溢出
            if (this.screenshots.length > 300) { // 最多保存10秒的截图
                this.screenshots.shift();
            }
        }, 33); // 约30fps
    }

    async startNormalRecording() {
        // Get canvas stream
        this.stream = this.canvas.captureStream(30); // 30 FPS

        // Get audio stream
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Combine video and audio streams
        const tracks = [...this.stream.getTracks(), ...audioStream.getTracks()];
        const combinedStream = new MediaStream(tracks);

        // Get supported mime type
        const mimeType = this.getSupportedMimeType();
        
        // Create media recorder with mobile-optimized settings
        const options = {
            mimeType: mimeType,
            videoBitsPerSecond: 1500000, // 1.5 Mbps for better mobile compatibility
            audioBitsPerSecond: 128000   // 128 kbps audio
        };

        // Create media recorder
        this.mediaRecorder = new MediaRecorder(combinedStream, options);

        // Set up recording handlers
        this.chunks = [];
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        // Start recording
        this.mediaRecorder.start(1000); // Save data every second
    }

    getSupportedMimeType() {
        const types = [
            'video/mp4;codecs=h264,aac',
            'video/mp4',
            'video/webm;codecs=h264,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                this.log(`使用编码格式: ${type}`);
                return type;
            }
        }

        throw new Error('No supported video format found');
    }

    setGameEnd() {
        this.gameEndTime = Date.now();
        setTimeout(() => this.stopRecording(), this.postGameDelay);
    }

    async stopRecording() {
        if (!this.isRecording) {
            this.log('没有正在进行的录制');
            return null;
        }

        try {
            this.log('停止录制...');
            this.createProgressBar();
            this.updateProgress(0, '正在处理录像...');

            let result;
            if (this.isWechat) {
                result = await this.stopWechatRecording();
            } else {
                result = await this.stopNormalRecording();
            }

            // Store the result and automatically trigger export
            this.recordedBlob = result;
            this.updateProgress(100, '录像处理完成！正在保存...');
            
            // Automatically trigger export
            setTimeout(() => {
                this.handleVideoExport();
                this.removeProgressBar();
            }, 1000);

            return result;

        } catch (error) {
            this.log(`停止录制错误: ${error.message}`);
            console.error('Stop recording error:', error);
            this.removeProgressBar();
            return null;
        }
    }

    async stopWechatRecording() {
        if (this.screenshotInterval) {
            clearInterval(this.screenshotInterval);
        }

        // 在微信中，我们将最后一张截图保存并分享
        const lastScreenshot = this.screenshots[this.screenshots.length - 1];
        
        // 将base64转换为Blob
        const response = await fetch(lastScreenshot);
        const blob = await response.blob();
        
        // 清理截图数组
        this.screenshots = [];
        
        return blob;
    }

    async stopNormalRecording() {
        const recordingDuration = Date.now() - this.recordingStartTime;
        const blob = await new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = () => {
                try {
                    this.updateProgress(50, '正在合成视频...');
                    const blob = new Blob(this.chunks, { type: 'video/mp4' });
                    resolve(blob);
                } catch (error) {
                    reject(error);
                }
            };
            this.mediaRecorder.onerror = (event) => {
                reject(event.error);
            };
            this.mediaRecorder.stop();
        });

        // Clean up recording resources
        this.isRecording = false;
        this.chunks = [];
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stream = null;
        this.mediaRecorder = null;

        return blob;
    }

    async handleVideoExport() {
        if (!this.recordedBlob) {
            this.log('没有可导出的录像');
            return;
        }

        try {
            if (this.isWechat) {
                // 在微信中使用微信的图片接口
                wx.previewImage({
                    current: URL.createObjectURL(this.recordedBlob),
                    urls: [URL.createObjectURL(this.recordedBlob)],
                    success: () => {
                        this.log('图片预览成功');
                    },
                    fail: (error) => {
                        this.log(`图片预览失败: ${error.errMsg}`);
                        // 显示提示
                        alert('请长按图片保存或分享');
                    }
                });
            } else {
                // 其他浏览器使用标准分享或下载
                if (navigator.share && navigator.canShare) {
                    const file = new File([this.recordedBlob], 
                        `游戏录像_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.mp4`, 
                        { type: 'video/mp4' });
                    
                    try {
                        await navigator.share({
                            files: [file],
                            title: '小鸡闯关游戏录像',
                            text: '来看看我的游戏录像！'
                        });
                        return;
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Share failed:', error);
                        }
                    }
                }
                
                // Fallback to direct download
                const url = URL.createObjectURL(this.recordedBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `游戏录像_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.mp4`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }

            this.log('录像导出成功');
        } catch (error) {
            this.log(`录像导出错误: ${error.message}`);
            console.error('Export error:', error);
            alert('视频导出失败，请重试');
        }
    }

    cleanup() {
        if (this.isRecording) {
            if (this.isWechat && this.screenshotInterval) {
                clearInterval(this.screenshotInterval);
                this.screenshots = [];
            }
            this.stopRecording();
        }
        this.chunks = [];
        this.isRecording = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stream = null;
        this.mediaRecorder = null;
        this.recordedBlob = null;
        this.removeProgressBar();
        this.log('录像机已清理');
    }

    isActive() {
        return this.isRecording;
    }
}

window.GameRecorder = GameRecorder;
