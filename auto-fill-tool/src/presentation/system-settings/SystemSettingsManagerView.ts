/**
 * SystemSettingsManagerView
 * システム設定画面のView層
 */

import { SystemSettings } from '@domain/entities/SystemSettings';
import { ISystemSettingsManagerView } from './SystemSettingsManagerPresenter';

export class SystemSettingsManagerView implements ISystemSettingsManagerView {
  private settingsContainer: HTMLElement;
  private loadingIndicator: HTMLElement;
  private messageContainer: HTMLElement;

  constructor() {
    this.settingsContainer = document.getElementById('settings-container') || document.createElement('div');
    this.loadingIndicator = document.getElementById('loading-indicator') || document.createElement('div');
    this.messageContainer = document.getElementById('message-container') || document.createElement('div');
  }

  showSettings(settings: SystemSettings): void {
    this.settingsContainer.innerHTML = '';
    
    const form = document.createElement('form');
    form.className = 'space-y-6';
    form.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-4">リトライ設定</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              リトライ待機時間（最小秒）
            </label>
            <input type="number" id="retryWaitSecondsMin" 
                   value="${settings.getRetryWaitSecondsMin()}" 
                   class="form-input w-full" min="1" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              リトライ待機時間（最大秒）
            </label>
            <input type="number" id="retryWaitSecondsMax" 
                   value="${settings.getRetryWaitSecondsMax()}" 
                   class="form-input w-full" min="1" />
          </div>
        </div>
        
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            リトライ回数（-1で無限回）
          </label>
          <input type="number" id="retryCount" 
                 value="${settings.getRetryCount()}" 
                 class="form-input w-full" min="-1" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-4">録画設定</h3>
        
        <div class="space-y-4">
          <div class="flex items-center">
            <input type="checkbox" id="recordingEnabled" 
                   ${settings.isRecordingEnabled() ? 'checked' : ''} 
                   class="form-checkbox" />
            <label for="recordingEnabled" class="ml-2 text-sm text-gray-700">
              タブ録画を有効にする
            </label>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              録画ビットレート（Mbps）
            </label>
            <input type="number" id="recordingBitrate" 
                   value="${settings.getRecordingBitrate()}" 
                   class="form-input w-full" min="0.5" max="10" step="0.1" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              録画保持期間（日）
            </label>
            <input type="number" id="recordingRetentionDays" 
                   value="${settings.getRecordingRetentionDays()}" 
                   class="form-input w-full" min="1" max="365" />
          </div>
        </div>
      </div>

      <div class="flex justify-between">
        <button type="button" id="resetBtn" class="btn-danger">
          デフォルトに戻す
        </button>
        <button type="submit" class="btn-primary">
          設定を保存
        </button>
      </div>
    `;

    this.settingsContainer.appendChild(form);
    this.attachEventListeners();
  }

  showError(message: string): void {
    this.showMessage(message, 'error');
  }

  showSuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  showLoading(isLoading: boolean): void {
    this.loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.messageContainer.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-4 mb-4 rounded ${
      type === 'success' 
        ? 'bg-green-100 border border-green-400 text-green-700' 
        : 'bg-red-100 border border-red-400 text-red-700'
    }`;
    messageDiv.textContent = message;
    
    this.messageContainer.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  private attachEventListeners(): void {
    const form = this.settingsContainer.querySelector('form');
    const resetBtn = document.getElementById('resetBtn');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).saveSettings();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('設定をデフォルトに戻しますか？')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).resetSettings();
        }
      });
    }
  }
}
