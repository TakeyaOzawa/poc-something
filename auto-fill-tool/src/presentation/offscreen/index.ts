/**
 * Offscreen Document Entry Point
 * オフスクリーンドキュメントのエントリーポイント
 */

// オフスクリーンドキュメントは録画処理などのバックグラウンド処理用
class OffscreenManager {
  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      switch (message.type) {
        case 'START_RECORDING':
          this.startRecording(message.payload);
          break;
        case 'STOP_RECORDING':
          this.stopRecording();
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    });
  }

  private async startRecording(_config: unknown): Promise<void> {
    try {
      console.log('Starting recording');
      // TODO: 録画開始処理
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  private async stopRecording(): Promise<void> {
    try {
      console.log('Stopping recording');
      // TODO: 録画停止処理
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }
}

// 初期化
new OffscreenManager();
