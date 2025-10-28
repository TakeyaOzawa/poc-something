/**
 * Presentation Layer: Appearance Settings Manager
 * Manages appearance settings tab operations including gradient background system
 */

import { Logger } from '@domain/types/logger.types';
import { SystemSettingsPresenter } from './SystemSettingsPresenter';
import { SystemSettings } from '@domain/entities/SystemSettings';

export class AppearanceSettingsManager {
  private form: HTMLFormElement;
  private cancelButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private gradientStartColor: HTMLInputElement;
  private gradientStartColorText: HTMLInputElement;
  private gradientEndColor: HTMLInputElement;
  private gradientEndColorText: HTMLInputElement;
  private gradientAngle: HTMLInputElement;
  private gradientAngleDisplay: HTMLSpanElement;

  constructor(
    private presenter: SystemSettingsPresenter,
    private logger: Logger
  ) {
    this.form = document.getElementById('appearanceSettingsForm') as HTMLFormElement;
    this.cancelButton = document.getElementById('appearanceCancelBtn') as HTMLButtonElement;
    this.resetButton = document.getElementById('appearanceResetBtn') as HTMLButtonElement;
    this.gradientStartColor = document.getElementById('gradientStartColor') as HTMLInputElement;
    this.gradientStartColorText = document.getElementById(
      'gradientStartColorText'
    ) as HTMLInputElement;
    this.gradientEndColor = document.getElementById('gradientEndColor') as HTMLInputElement;
    this.gradientEndColorText = document.getElementById('gradientEndColorText') as HTMLInputElement;
    this.gradientAngle = document.getElementById('gradientAngle') as HTMLInputElement;
    this.gradientAngleDisplay = document.getElementById('gradientAngleDisplay') as HTMLSpanElement;

    // Log missing elements for debugging
    if (!this.form) this.logger.error('Appearance settings form element not found');
    if (!this.gradientStartColor) this.logger.error('Gradient start color input not found');
    if (!this.gradientStartColorText)
      this.logger.error('Gradient start color text input not found');
    if (!this.gradientEndColor) this.logger.error('Gradient end color input not found');
    if (!this.gradientEndColorText) this.logger.error('Gradient end color text input not found');
    if (!this.gradientAngle) this.logger.error('Gradient angle input not found');
    if (!this.gradientAngleDisplay) this.logger.error('Gradient angle display span not found');

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });
    this.cancelButton?.addEventListener('click', () => this.cancelChanges());
    this.resetButton?.addEventListener('click', () => this.resetSettings());

    // Sync color picker with text input
    this.gradientStartColor?.addEventListener('input', () => {
      if (this.gradientStartColorText) {
        this.gradientStartColorText.value = this.gradientStartColor.value;
      }
      this.updateLivePreview();
    });
    this.gradientStartColorText?.addEventListener('input', () => {
      if (this.gradientStartColor && /^#[A-Fa-f0-9]{6}$/.test(this.gradientStartColorText.value)) {
        this.gradientStartColor.value = this.gradientStartColorText.value;
        this.updateLivePreview();
      }
    });

    this.gradientEndColor?.addEventListener('input', () => {
      if (this.gradientEndColorText) {
        this.gradientEndColorText.value = this.gradientEndColor.value;
      }
      this.updateLivePreview();
    });
    this.gradientEndColorText?.addEventListener('input', () => {
      if (this.gradientEndColor && /^#[A-Fa-f0-9]{6}$/.test(this.gradientEndColorText.value)) {
        this.gradientEndColor.value = this.gradientEndColorText.value;
        this.updateLivePreview();
      }
    });

    this.gradientAngle?.addEventListener('input', () => this.updateLivePreview());
  }

  private updateLivePreview(): void {
    if (!this.gradientStartColor || !this.gradientEndColor || !this.gradientAngle) {
      this.logger.warn('Cannot update live preview: color or angle input not found');
      return;
    }

    const startColor = this.gradientStartColor.value;
    const endColor = this.gradientEndColor.value;
    const angle = parseInt(this.gradientAngle.value);

    // Update angle display
    if (this.gradientAngleDisplay) {
      this.gradientAngleDisplay.textContent = `${angle}°`;
    }

    // Apply gradient to body background
    this.applyGradient(startColor, endColor, angle);
  }

  private applyGradient(startColor: string, endColor: string, angle: number): void {
    const gradient = `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
    document.body.style.background = gradient;
  }

  private async saveSettings(): Promise<void> {
    try {
      const updates = this.collectFormData();
      await this.presenter.saveAppearanceSettings(updates);
    } catch (error) {
      this.logger.error('Failed to save appearance settings', error);
    }
  }

  private async resetSettings(): Promise<void> {
    await this.presenter.resetAppearanceSettings();
  }

  private async cancelChanges(): Promise<void> {
    // Reload settings to restore original values
    await this.presenter.loadAllSettings();
  }

  private collectFormData(): Partial<SystemSettings> {
    return {
      gradientStartColor: this.gradientStartColor.value,
      gradientEndColor: this.gradientEndColor.value,
      gradientAngle: parseInt(this.gradientAngle.value),
    };
  }

  /**
   * Load settings into form fields
   */
  loadSettings(settings: Partial<SystemSettings>): void {
    if (settings.gradientStartColor !== undefined) {
      if (this.gradientStartColor) {
        this.gradientStartColor.value = settings.gradientStartColor;
      }
      if (this.gradientStartColorText) {
        this.gradientStartColorText.value = settings.gradientStartColor;
      }
    }
    if (settings.gradientEndColor !== undefined) {
      if (this.gradientEndColor) {
        this.gradientEndColor.value = settings.gradientEndColor;
      }
      if (this.gradientEndColorText) {
        this.gradientEndColorText.value = settings.gradientEndColor;
      }
    }
    if (settings.gradientAngle !== undefined) {
      if (this.gradientAngle) {
        this.gradientAngle.value = settings.gradientAngle.toString();
      }
      if (this.gradientAngleDisplay) {
        this.gradientAngleDisplay.textContent = `${settings.gradientAngle}°`;
      }
    }
    // Update live preview
    this.updateLivePreview();
  }
}
