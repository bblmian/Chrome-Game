import SwiftUI
import SpriteKit
import AVFoundation

struct ContentView: View {
    @StateObject private var audioController = AudioController()
    @State private var gameScene: GameScene?
    @State private var showingAudioPermissionAlert = false
    @State private var isGameStarted = false
    
    var body: some View {
        ZStack {
            // Game Scene
            if let scene = gameScene {
                SpriteView(scene: scene)
                    .ignoresSafeArea()
            }
            
            // UI Overlay
            VStack {
                if !isGameStarted {
                    // Title and Start Screen
                    VStack(spacing: 20) {
                        Image(systemName: "bird.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.yellow)
                        
                        Text("小鸡闯关")
                            .font(.largeTitle)
                            .bold()
                        
                        Button(action: startGame) {
                            Text("开始游戏")
                                .font(.title2)
                                .bold()
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                        
                        // Game Instructions
                        VStack(alignment: .leading, spacing: 10) {
                            Text("游戏说明:")
                                .font(.headline)
                            Text("• 发出声音向前移动 - 声音越大移动越快")
                            Text("• 发出高音跳跃 - 音调越高跳得越高")
                            Text("• 持续发声可以延长跳跃时间")
                        }
                        .padding()
                        .background(Color.black.opacity(0.7))
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                }
            }
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
        scene.scaleMode = .aspectFill
        scene.audioController = audioController
        self.gameScene = scene
        isGameStarted = true
    }
}

#Preview {
    ContentView()
}
