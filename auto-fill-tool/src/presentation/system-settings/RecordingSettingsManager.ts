/**
 * Presentation Layer: Recording Settings Manager
 * Manages recording settings tab operations
 */

import { Logger } from '@domain/types/logger.types';
import { SystemSettingsPresenter } from './SystemSettingsPresenter';
import { SystemSettings } from '@domain/entities/SystemSettings';

export class RecordingSettingsManager {
  private form: HTMLFormElement;
  private cancelButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private enableTabRecording: HTMLInputElement;
  private enableAudioRecording: HTMLInputElement;
  private recordingBitrate: HTMLInputElement;
  private recordingRetentionDays: HTMLInputElement;

  constructor(
    private presenter: SystemSettingsPresenter,
    private logger: Logger
  ) {
    this.form = document.getElementById('recordingSettingsForm') as HTMLFormElement;
    this.cancelButton = document.getElementById('recordingCancelBtn') as HTMLButtonElement;
    this.resetButton = document.getElementById('recordingResetBtn') as HTMLButtonElement;
    this.enableTabRecording = document.getElementById('enableTabRecording') as HTMLInputElement;
    this.enableAudioRecording = document.getElementById('enableAudioRecording') as HTMLInputElement;
    this.recordingBitrate = document.getElementById('recordingBitrate') as HTMLInputElement;
    this.recordingRetentionDays = document.getElementById(
      'recordingRetentionDays'
    ) as HTMLInputElement;

    // Log missing elements for debugging
    if (!this.form) this.logger.error('Recording settings form element not found');
    if (!this.enableTabRecording) this.logger.error('Enable tab recording checkbox not found');
    if (!this.enableAudioRecording) this.logger.error('Enable audio recording checkbox not found');
    if (!this.recordingBitrate) this.logger.error('Recording bitrate input not found');
    if (!this.recordingRetentionDays) this.logger.error('Recording retention days input not found');

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });
    this.cancelButton?.addEventListener('click', () => this.cancelChanges());
    this.resetButton?.addEventListener('click', () => this.resetSettings());
  }

  private async saveSettings(): Promise<void> {
    try {
      const updates = this.collectFormData();
      await this.presenter.saveRecordingSettings(updates);
    } catch (error) {
      this.logger.error('Failed to save recording settings', error);
    }
  }

  private async resetSettings(): Promise<void> {
    await this.presenter.resetSettings();
  }

  private async cancelChanges(): Promise<void> {
    // Reload settings to restore original values
    await this.presenter.loadSettings();
  }

  private collectFormData(): Partial<SystemSettings> {
    return {
      enableTabRecording: this.enableTabRecording.checked,
      enableAudioRecording: this.enableAudioRecording.checked,
      recordingBitrate: parseInt(this.recordingBitrate.value),
      recordingRetentionDays: parseInt(this.recordingRetentionDays.value),
    };
  }

  /**
   * Load settings into form fields
   */
  loadSettings(settings: Partial<SystemSettings>): void {
    if (settings.enableTabRecording !== undefined && this.enableTabRecording) {
      this.enableTabRecording.checked = settings.enableTabRecording;
    }
    if (settings.enableAudioRecording !== undefined && this.enableAudioRecording) {
      this.enableAudioRecording.checked = settings.enableAudioRecording;
    }
    if (settings.recordingBitrate !== undefined && this.recordingBitrate) {
      this.recordingBitrate.value = settings.recordingBitrate.toString();
    }
    if (settings.recordingRetentionDays !== undefined && this.recordingRetentionDays) {
      this.recordingRetentionDays.value = settings.recordingRetentionDays.toString();
    }
  }
}
