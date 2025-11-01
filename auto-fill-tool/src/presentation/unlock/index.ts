/**
 * Unlock Screen Entry Point
 * ロック解除画面のエントリーポイント
 */

class UnlockManager {
  private passwordInput: HTMLInputElement;
  private submitButton: HTMLButtonElement;
  private errorMessage: HTMLElement;
  private attemptCount: number = 0;
  private maxAttempts: number = 5;

  constructor() {
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.submitButton = document.getElementById('submit-btn') as HTMLButtonElement;
    this.errorMessage = document.getElementById('error-message') || document.createElement('div');
    
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = document.getElementById('unlock-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    if (this.passwordInput) {
      this.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSubmit();
        }
      });
    }
  }

  private async handleSubmit(): Promise<void> {
    const password = this.passwordInput?.value || '';
    
    if (!password) {
      this.showError('パスワードを入力してください');
      return;
    }

    try {
      this.setLoading(true);
      
      // TODO: パスワード検証処理
      const isValid = await this.validatePassword(password);
      
      if (isValid) {
        this.showSuccess('ロック解除しました');
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        this.attemptCount++;
        if (this.attemptCount >= this.maxAttempts) {
          this.showError(`${this.maxAttempts}回失敗しました。しばらく待ってから再試行してください。`);
          this.lockForm();
        } else {
          this.showError(`パスワードが正しくありません（${this.attemptCount}/${this.maxAttempts}）`);
        }
      }
    } catch (error) {
      this.showError('認証エラーが発生しました');
    } finally {
      this.setLoading(false);
    }
  }

  private async validatePassword(password: string): Promise<boolean> {
    // TODO: 実際のパスワード検証ロジック
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(password === 'test'); // 仮の実装
      }, 500);
    });
  }

  private showError(message: string): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message show';
    }
  }

  private showSuccess(message: string): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'success-message show';
    }
  }

  private setLoading(isLoading: boolean): void {
    if (this.submitButton) {
      this.submitButton.disabled = isLoading;
      this.submitButton.textContent = isLoading ? '認証中...' : 'ロック解除';
    }
  }

  private lockForm(): void {
    if (this.passwordInput) this.passwordInput.disabled = true;
    if (this.submitButton) this.submitButton.disabled = true;
    
    // 5分後にフォームを再有効化
    setTimeout(() => {
      if (this.passwordInput) this.passwordInput.disabled = false;
      if (this.submitButton) this.submitButton.disabled = false;
      this.attemptCount = 0;
    }, 5 * 60 * 1000);
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new UnlockManager();
});
