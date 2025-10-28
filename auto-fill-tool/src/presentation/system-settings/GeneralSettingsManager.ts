/**
 * Presentation Layer: General Settings Manager
 * Manages general settings tab operations
 */

import { Logger } from '@domain/types/logger.types';
import { SystemSettingsPresenter } from './SystemSettingsPresenter';
import { SystemSettings } from '@domain/entities/SystemSettings';

export class GeneralSettingsManager {
  private form: HTMLFormElement;
  private cancelButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private retryWaitMin: HTMLInputElement;
  private retryWaitMax: HTMLInputElement;
  private retryCount: HTMLInputElement;
  private waitForOptionsMilliseconds: HTMLInputElement;
  private autoFillProgressDialogMode: HTMLSelectElement;
  private logLevel: HTMLSelectElement;

  constructor(
    private presenter: SystemSettingsPresenter,
    private logger: Logger
  ) {
    this.form = document.getElementById('generalSettingsForm') as HTMLFormElement;
    this.cancelButton = document.getElementById('generalCancelBtn') as HTMLButtonElement;
    this.resetButton = document.getElementById('generalResetBtn') as HTMLButtonElement;
    this.retryWaitMin = document.getElementById('retryWaitSecondsMin') as HTMLInputElement;
    this.retryWaitMax = document.getElementById('retryWaitSecondsMax') as HTMLInputElement;
    this.retryCount = document.getElementById('retryCount') as HTMLInputElement;
    this.waitForOptionsMilliseconds = document.getElementById(
      'waitForOptionsMilliseconds'
    ) as HTMLInputElement;
    this.autoFillProgressDialogMode = document.getElementById(
      'autoFillProgressDialogMode'
    ) as HTMLSelectElement;
    this.logLevel = document.getElementById('logLevel') as HTMLSelectElement;

    // Log missing elements for debugging
    if (!this.form) this.logger.error('General settings form element not found');
    if (!this.retryWaitMin) this.logger.error('Retry wait min input not found');
    if (!this.retryWaitMax) this.logger.error('Retry wait max input not found');
    if (!this.retryCount) this.logger.error('Retry count input not found');
    if (!this.waitForOptionsMilliseconds)
      this.logger.error('Wait for options milliseconds input not found');
    if (!this.autoFillProgressDialogMode)
      this.logger.error('Auto fill progress dialog mode select not found');
    if (!this.logLevel) this.logger.error('Log level select not found');

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
      // Validate inputs
      const retryWaitMin = parseFloat(this.retryWaitMin.value);
      const retryWaitMax = parseFloat(this.retryWaitMax.value);
      const retryCountValue = parseInt(this.retryCount.value);

      if (isNaN(retryWaitMin) || retryWaitMin < 0) {
        alert('Retry wait time (min) must be 0 or greater');
        return;
      }

      if (isNaN(retryWaitMax) || retryWaitMax < 0) {
        alert('Retry wait time (max) must be 0 or greater');
        return;
      }

      if (retryWaitMax < retryWaitMin) {
        alert('Retry wait time (max) must be greater than or equal to min');
        return;
      }

      // Check if input contains decimal point (not an integer)
      if (isNaN(retryCountValue) || retryCountValue < 0 || this.retryCount.value.includes('.')) {
        alert('Retry count must be 0 or greater integer');
        return;
      }

      const updates = this.collectFormData();
      await this.presenter.saveGeneralSettings(updates);
    } catch (error) {
      this.logger.error('Failed to save general settings', error);
    }
  }

  private async resetSettings(): Promise<void> {
    await this.presenter.resetGeneralSettings();
  }

  private async cancelChanges(): Promise<void> {
    // Reload settings to restore original values
    await this.presenter.loadAllSettings();
  }

  private collectFormData(): Partial<SystemSettings> {
    return {
      retryWaitSecondsMin: parseFloat(this.retryWaitMin.value),
      retryWaitSecondsMax: parseFloat(this.retryWaitMax.value),
      retryCount: parseInt(this.retryCount.value),
      waitForOptionsMilliseconds: parseInt(this.waitForOptionsMilliseconds.value),
      autoFillProgressDialogMode: this.autoFillProgressDialogMode.value as
        | 'withCancel'
        | 'withoutCancel'
        | 'hidden',
      logLevel: parseInt(this.logLevel.value),
    };
  }

  /**
   * Load settings into form fields
   */
  // eslint-disable-next-line complexity -- This method performs straightforward sequential checks for 6 different settings fields. Each field requires a separate undefined check and assignment. Splitting into smaller functions would add unnecessary indirection without improving clarity.
  loadSettings(settings: Partial<SystemSettings>): void {
    if (settings.retryWaitSecondsMin !== undefined && this.retryWaitMin) {
      this.retryWaitMin.value = settings.retryWaitSecondsMin.toString();
    }
    if (settings.retryWaitSecondsMax !== undefined && this.retryWaitMax) {
      this.retryWaitMax.value = settings.retryWaitSecondsMax.toString();
    }
    if (settings.retryCount !== undefined && this.retryCount) {
      this.retryCount.value = settings.retryCount.toString();
    }
    if (settings.waitForOptionsMilliseconds !== undefined && this.waitForOptionsMilliseconds) {
      this.waitForOptionsMilliseconds.value = settings.waitForOptionsMilliseconds.toString();
    }
    if (settings.autoFillProgressDialogMode !== undefined && this.autoFillProgressDialogMode) {
      this.autoFillProgressDialogMode.value = settings.autoFillProgressDialogMode;
    }
    if (settings.logLevel !== undefined && this.logLevel) {
      this.logLevel.value = settings.logLevel.toString();
    }
  }
}
