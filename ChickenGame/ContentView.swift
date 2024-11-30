import SwiftUI
import SpriteKit
import AVFoundation

struct ContentView: View {
    @StateObject private var audioController = AudioController()
    @State private var gameScene: GameScene?
    @State private var showingAudioPermissionAlert = false
    @State private var isGameStarted = false
    @State private var isFullscreen = false
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Game Scene
                if let scene = gameScene {
                    SpriteView(scene: scene)
                        .ignoresSafeArea()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                
                // UI Overlay
                if !isGameStarted {
                    // Semi-transparent background
                    Color.black.opacity(0.7)
                        .ignoresSafeArea()
                    
                    // Title and Start Screen
                    VStack(spacing: 30) {
                        // Game Logo
                        VStack(spacing: 15) {
                            Image(systemName: "bird.fill")
                                .font(.system(size: 80))
                                .foregroundColor(.yellow)
                                .shadow(color: .orange, radius: 10, x: 0, y: 5)
                            
                            Text("小鸡闯关")
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                                .shadow(color: .orange, radius: 10)
                        }
                        .padding(.top, 50)
                        
                        // Start Button
                        Button(action: startGame) {
                            Text("开始游戏")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                                .frame(width: 200, height: 60)
                                .background(
                                    RoundedRectangle(cornerRadius: 30)
                                        .fill(LinearGradient(
                                            gradient: Gradient(colors: [.blue, .purple]),
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        ))
                                        .shadow(color: .blue.opacity(0.5), radius: 10, x: 0, y: 5)
                                )
                        }
                        
                        // Game Instructions
                        VStack(alignment: .leading, spacing: 15) {
                            Text("游戏说明")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                                .padding(.bottom, 5)
                            
                            InstructionRow(icon: "waveform", text: "发出声音向前移动 - 声音越大移动越快")
                            InstructionRow(icon: "arrow.up.circle", text: "发出高音跳跃 - 音调越高跳得越高")
                            InstructionRow(icon: "arrow.up.and.down.circle", text: "持续发声可以延长跳跃时间")
                        }
                        .padding(25)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(Color.white.opacity(0.1))
                                .shadow(color: .black.opacity(0.3), radius: 10)
                        )
                        .padding(.horizontal, 30)
                        
                        Spacer()
                    }
                }
                
                // Fullscreen Toggle Button (always visible)
                VStack {
                    HStack {
                        Spacer()
                        Button(action: toggleFullscreen) {
                            Image(systemName: isFullscreen ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .padding(15)
                                .background(Color.black.opacity(0.5))
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.3), radius: 5)
                        }
                        .padding([.top, .trailing], 20)
                    }
                    Spacer()
                }
            }
            .statusBar(hidden: isFullscreen)
        }
        .onAppear {
            setupAudioSession()
        }
        .alert("需要麦克风权限", isPresented: $showingAudioPermissionAlert) {
            Button("打开设置", role: .none) {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text("游戏需要使用麦克风来控制小鸡的移动和跳跃。请在设置中允许使用麦克风。")
        }
    }
    
    private func setupAudioSession() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                if granted {
                    do {
                        try AVAudioSession.sharedInstance().setCategory(.playAndRecord)
                        try AVAudioSession.sharedInstance().setActive(true)
                        audioController.setupAudioEngine()
                    } catch {
                        print("Audio session setup error: \(error)")
                    }
                } else {
                    showingAudioPermissionAlert = true
                }
            }
        }
    }
    
    private func startGame() {
        let scene = GameScene(size: UIScreen.main.bounds.size)
        scene.scaleMode = .resizeFill
        scene.audioController = audioController
        self.gameScene = scene
        isGameStarted = true
    }
    
    private func toggleFullscreen() {
        isFullscreen.toggle()
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
            windowScene.windows.first?.overrideUserInterfaceStyle = isFullscreen ? .dark : .unspecified
        }
    }
}

struct InstructionRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(.yellow)
                .frame(width: 30)
            
            Text(text)
                .font(.system(size: 18, design: .rounded))
                .foregroundColor(.white)
        }
    }
}

#Preview {
    ContentView()
}
