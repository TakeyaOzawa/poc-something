/**
 * Presentation Layer: System Settings View
 * Handles DOM rendering and updates for system settings
 */

import { SystemSettingsView } from './SystemSettingsPresenter';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';

export class SystemSettingsViewImpl implements SystemSettingsView {
  private statusMessage: HTMLDivElement | null;

  constructor() {
    this.statusMessage = document.getElementById('statusMessage') as HTMLDivElement | null;
  }

  showSuccess(message: string): void {
    this.showStatus(message, 'success');
  }

  showError(message: string): void {
    this.showStatus(message, 'error');
  }

  showLoading(): void {
    if (!this.statusMessage) {
      console.warn('[SystemSettingsView] Status message element not found');
      return;
    }
    this.statusMessage.textContent = I18nAdapter.getMessage('loading');
    this.statusMessage.className = 'status-message loading';
    this.statusMessage.style.display = 'block';
  }

  hideLoading(): void {
    if (!this.statusMessage) {
      return;
    }
    // Hide after a delay to ensure smooth transition
    setTimeout(() => {
      if (this.statusMessage && this.statusMessage.classList.contains('loading')) {
        this.statusMessage.style.display = 'none';
      }
    }, 300);
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    if (!this.statusMessage) {
      console.warn('[SystemSettingsView] Status message element not found');
      // Fallback to alert for error messages
      if (type === 'error') {
        alert(message);
      }
      return;
    }
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (this.statusMessage) {
        this.statusMessage.style.display = 'none';
      }
    }, 3000);
  }

  updateGeneralSettings(settings: SystemSettingsCollection): void {
    const retryWaitMin = document.getElementById('retryWaitSecondsMin') as HTMLInputElement;
    const retryWaitMax = document.getElementById('retryWaitSecondsMax') as HTMLInputElement;
    const retryCount = document.getElementById('retryCount') as HTMLInputElement;
    const showXPathDialog = document.getElementById(
      'showXPathDialogDuringAutoFill'
    ) as HTMLInputElement;

    if (retryWaitMin) retryWaitMin.value = settings.getRetryWaitSecondsMin().toString();
    if (retryWaitMax) retryWaitMax.value = settings.getRetryWaitSecondsMax().toString();
    if (retryCount) retryCount.value = settings.getRetryCount().toString();
    if (showXPathDialog)
      showXPathDialog.checked = settings.getAutoFillProgressDialogMode() !== 'hidden';
  }

  updateRecordingSettings(settings: SystemSettingsCollection): void {
    const enableAudioRecording = document.getElementById(
      'enableAudioRecording'
    ) as HTMLInputElement;
    if (enableAudioRecording) {
      enableAudioRecording.checked = settings.getEnableAudioRecording();
    }
  }

  updateAppearanceSettings(settings: SystemSettingsCollection): void {
    const gradientStartColor = document.getElementById('gradientStartColor') as HTMLInputElement;
    const gradientEndColor = document.getElementById('gradientEndColor') as HTMLInputElement;
    const gradientAngle = document.getElementById('gradientAngle') as HTMLInputElement;
    const gradientAngleValue = document.getElementById('gradientAngleValue') as HTMLSpanElement;

    if (gradientStartColor) gradientStartColor.value = settings.getGradientStartColor();
    if (gradientEndColor) gradientEndColor.value = settings.getGradientEndColor();
    if (gradientAngle) {
      gradientAngle.value = settings.getGradientAngle().toString();
      if (gradientAngleValue) {
        gradientAngleValue.textContent = `${settings.getGradientAngle()}°`;
      }
    }
  }

  applyGradientBackground(startColor: string, endColor: string, angle: number): void {
    const gradient = `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
    document.body.style.background = gradient;
  }
}
