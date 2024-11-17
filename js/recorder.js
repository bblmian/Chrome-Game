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
        this.recordedBlob = null;  // Store the recorded blob
        
        // Progress bar elements
        this.progressOverlay = null;
        this.progressBar = null;
        this.progressText = null;
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
            
            // Get canvas stream
            this.stream = this.canvas.captureStream(30); // 30 FPS

            // Get audio stream
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Combine video and audio streams
            const tracks = [...this.stream.getTracks(), ...audioStream.getTracks()];
            const combinedStream = new MediaStream(tracks);

            // Create media recorder with lower quality for mobile
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            this.mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: isMobile ? 1500000 : 2500000 // 1.5 Mbps for mobile, 2.5 Mbps for desktop
            });

            // Set up recording handlers
            this.chunks = [];
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            // Start recording
            this.mediaRecorder.start(1000); // Save data every second
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

    setGameEnd() {
        this.gameEndTime = Date.now();
        setTimeout(() => this.stopRecording(), this.postGameDelay);
    }

    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            this.log('没有正在进行的录制');
            return null;
        }

        try {
            this.log('停止录制...');
            this.createProgressBar();
            this.updateProgress(0, '正在处理录像...');

            // Create a promise that resolves when recording stops
            const recordingDuration = Date.now() - this.recordingStartTime;
            const blob = await new Promise((resolve, reject) => {
                this.mediaRecorder.onstop = () => {
                    try {
                        this.updateProgress(50, '正在合成视频...');
                        const blob = new Blob(this.chunks, { type: 'video/webm' });
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

            // Store the blob for later download
            this.recordedBlob = blob;

            this.updateProgress(100, '录像处理完成！点击下载按钮保存');
            setTimeout(() => this.removeProgressBar(), 1000);

            this.log(`录制完成 - 时长: ${Math.round(recordingDuration / 1000)}秒`);
            return blob;

        } catch (error) {
            this.log(`停止录制错误: ${error.message}`);
            console.error('Stop recording error:', error);
            this.removeProgressBar();
            return null;
        }
    }

    downloadRecording() {
        if (!this.recordedBlob) {
            this.log('没有可下载的录像');
            return;
        }

        try {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            
            // Create download overlay
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '1000',
                padding: '20px',
                boxSizing: 'border-box'
            });

            // Create content container
            const container = document.createElement('div');
            Object.assign(container.style, {
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '90%',
                width: '300px',
                textAlign: 'center'
            });

            if (isIOS) {
                // For iOS devices, create a video player
                const video = document.createElement('video');
                video.src = URL.createObjectURL(this.recordedBlob);
                video.controls = true;
                Object.assign(video.style, {
                    width: '100%',
                    marginBottom: '15px',
                    borderRadius: '5px'
                });
                
                const text = document.createElement('p');
                text.textContent = '请长按视频选择"保存视频"';
                Object.assign(text.style, {
                    margin: '10px 0',
                    color: '#666'
                });

                container.appendChild(video);
                container.appendChild(text);
            } else {
                // For other devices, use direct download
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = '点击下载视频';
                Object.assign(downloadBtn.style, {
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    width: '100%'
                });

                downloadBtn.onclick = () => {
                    const url = URL.createObjectURL(this.recordedBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `游戏录像_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                };

                container.appendChild(downloadBtn);
            }

            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '关闭';
            Object.assign(closeBtn.style, {
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '100%'
            });

            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
            };

            container.appendChild(closeBtn);
            overlay.appendChild(container);
            document.body.appendChild(overlay);

            this.log('显示下载界面');
        } catch (error) {
            this.log(`下载录像错误: ${error.message}`);
            console.error('Download error:', error);
            
            // Show error message
            alert('视频下载失败，请重试');
        }
    }

    cleanup() {
        if (this.isRecording) {
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
