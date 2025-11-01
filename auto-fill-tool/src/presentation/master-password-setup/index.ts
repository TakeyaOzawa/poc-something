/**
 * Master Password Setup Entry Point
 * マスターパスワード設定画面のエントリーポイント
 */

import { MasterPasswordPolicy } from '@domain/entities/MasterPasswordPolicy';

class MasterPasswordSetupManager {
  private passwordInput: HTMLInputElement;
  private confirmInput: HTMLInputElement;
  private strengthMeter: HTMLElement;
  private submitButton: HTMLButtonElement;
  private policy: MasterPasswordPolicy;

  constructor() {
    this.passwordInput = document.getElementById('password') as HTMLInputElement;
    this.confirmInput = document.getElementById('confirm-password') as HTMLInputElement;
    this.strengthMeter = document.getElementById('strength-meter') || document.createElement('div');
    this.submitButton = document.getElementById('submit-btn') as HTMLButtonElement;
    this.policy = MasterPasswordPolicy.create();
    
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => {
        this.updateStrengthMeter();
        this.validateForm();
      });
    }

    if (this.confirmInput) {
      this.confirmInput.addEventListener('input', () => {
        this.validateForm();
      });
    }

    const form = document.getElementById('password-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  private updateStrengthMeter(): void {
    const password = this.passwordInput?.value || '';
    const strengthResult = this.policy.calculateStrength(password);
    
    if (this.strengthMeter) {
      this.strengthMeter.className = `strength-meter ${this.getStrengthClass(strengthResult.score)}`;
      this.strengthMeter.textContent = this.getStrengthText(strengthResult.score);
    }
  }

  private getStrengthClass(strength: number): string {
    if (strength >= 80) return 'strong';
    if (strength >= 60) return 'good';
    if (strength >= 40) return 'fair';
    return 'weak';
  }

  private getStrengthText(strength: number): string {
    if (strength >= 80) return '強力';
    if (strength >= 60) return '良好';
    if (strength >= 40) return '普通';
    return '弱い';
  }

  private validateForm(): void {
    const password = this.passwordInput?.value || '';
    const confirm = this.confirmInput?.value || '';
    
    const validationResult = this.policy.validatePassword(password);
    const isValid = validationResult.errors.length === 0 && password === confirm;
    
    if (this.submitButton) {
      this.submitButton.disabled = !isValid;
    }
  }

  private async handleSubmit(): Promise<void> {
    try {
      // TODO: マスターパスワードの保存処理
      console.log('Master password setup completed');
      window.close();
    } catch (error) {
      console.error('Failed to setup master password:', error);
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new MasterPasswordSetupManager();
});
