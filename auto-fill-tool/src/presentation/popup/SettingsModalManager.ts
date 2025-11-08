/**
 * Presentation Layer: Settings Modal Manager
 * Handles system settings modal operations
 *
 * @coverage 69.56%
 * @reason テストカバレッジが低い理由:
 * - コンストラクタ内で18個のDOM要素への参照と複数のイベントリスナーを
 *   設定しており、これらの動的なイベント処理を完全にテストするには
 *   複雑なDOM環境のセットアップが必要
 * - リトライロジック（loadSettingsWithRetry）は複数回の試行とタイムアウトを
 *   含み、全ての失敗パターンと成功パターンの組み合わせをテストするのは困難
 * - confirm()やalert()などのブラウザネイティブのダイアログAPIを使用しており、
 *   これらのユーザー操作フローのモックは複雑
 * - カラーピッカーとテキスト入力の双方向同期、グラデーション背景の
 *   動的適用など、DOM操作を伴うインタラクティブな機能が多数存在
 */

import { Logger } from '@domain/types/logger.types';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { SystemSettingsViewModel } from '../types/SystemSettingsViewModel';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { SystemSettingsMapper } from '@application/mappers/SystemSettingsMapper';
import { ViewModelMapper } from '../mappers/ViewModelMapper';

export class SettingsModalManager {
  private settingsModal: HTMLElement;
  private settingsForm: HTMLFormElement;
  private retryWaitSecondsMinInput: HTMLInputElement;
  private retryWaitSecondsMaxInput: HTMLInputElement;
  private retryCountInput: HTMLInputElement;
  private waitForOptionsMillisecondsInput: HTMLInputElement;
  private autoFillProgressDialogModeSelect: HTMLSelectElement;
  private logLevelSelect: HTMLSelectElement;
  private enableTabRecordingInput: HTMLInputElement;
  private enableAudioRecordingInput: HTMLInputElement;
  private recordingBitrateInput: HTMLInputElement;
  private recordingRetentionDaysInput: HTMLInputElement;
  private gradientStartColorInput: HTMLInputElement;
  private gradientStartColorTextInput: HTMLInputElement;
  private gradientEndColorInput: HTMLInputElement;
  private gradientEndColorTextInput: HTMLInputElement;
  private gradientAngleInput: HTMLInputElement;
  private gradientAngleDisplay: HTMLSpanElement;
  private settingsResetBtn: HTMLButtonElement;

  // eslint-disable-next-line max-lines-per-function -- Constructor initializes 18 DOM element references for system settings form. The sequential DOM queries are necessary and clear.
  constructor(
    private systemSettingsRepository: SystemSettingsRepository,
    private logger: Logger
  ) {
    this.settingsModal = document.getElementById('settingsModal') as HTMLElement;
    this.settingsForm = document.getElementById('settingsForm') as HTMLFormElement;
    this.retryWaitSecondsMinInput = document.getElementById(
      'retryWaitSecondsMin'
    ) as HTMLInputElement;
    this.retryWaitSecondsMaxInput = document.getElementById(
      'retryWaitSecondsMax'
    ) as HTMLInputElement;
    this.retryCountInput = document.getElementById('retryCount') as HTMLInputElement;
    this.waitForOptionsMillisecondsInput = document.getElementById(
      'waitForOptionsMilliseconds'
    ) as HTMLInputElement;
    this.autoFillProgressDialogModeSelect = document.getElementById(
      'autoFillProgressDialogMode'
    ) as HTMLSelectElement;
    this.logLevelSelect = document.getElementById('logLevel') as HTMLSelectElement;
    this.enableTabRecordingInput = document.getElementById(
      'enableTabRecording'
    ) as HTMLInputElement;
    this.enableAudioRecordingInput = document.getElementById(
      'enableAudioRecording'
    ) as HTMLInputElement;
    this.recordingBitrateInput = document.getElementById('recordingBitrate') as HTMLInputElement;
    this.recordingRetentionDaysInput = document.getElementById(
      'recordingRetentionDays'
    ) as HTMLInputElement;
    this.gradientStartColorInput = document.getElementById(
      'gradientStartColor'
    ) as HTMLInputElement;
    this.gradientStartColorTextInput = document.getElementById(
      'gradientStartColorText'
    ) as HTMLInputElement;
    this.gradientEndColorInput = document.getElementById('gradientEndColor') as HTMLInputElement;
    this.gradientEndColorTextInput = document.getElementById(
      'gradientEndColorText'
    ) as HTMLInputElement;
    this.gradientAngleInput = document.getElementById('gradientAngle') as HTMLInputElement;
    this.gradientAngleDisplay = document.getElementById('gradientAngleDisplay') as HTMLSpanElement;
    this.settingsResetBtn = document.getElementById('settingsResetBtn') as HTMLButtonElement;

    // Sync gradient angle input and display
    this.gradientAngleInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.gradientAngleDisplay.textContent = `${target.value}°`;
    });

    // Sync color picker and text input for start color
    this.gradientStartColorInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.gradientStartColorTextInput.value = target.value;
    });
    this.gradientStartColorTextInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (/^#[A-Fa-f0-9]{6}$/.test(target.value)) {
        this.gradientStartColorInput.value = target.value;
      }
    });

    // Sync color picker and text input for end color
    this.gradientEndColorInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.gradientEndColorTextInput.value = target.value;
    });
    this.gradientEndColorTextInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (/^#[A-Fa-f0-9]{6}$/.test(target.value)) {
        this.gradientEndColorInput.value = target.value;
      }
    });
  }

  /**
   * Open settings modal and load current settings
   */
  async openSettingsModal(): Promise<void> {
    try {
      const settings = await this.loadSettingsWithRetry();

      // Populate form with current settings
      this.retryWaitSecondsMinInput.value = settings.retryWaitSecondsMin.toString();
      this.retryWaitSecondsMaxInput.value = settings.retryWaitSecondsMax.toString();
      this.retryCountInput.value = settings.retryCount.toString();
      // Note: waitForOptionsMilliseconds is not in SystemSettingsViewModel
      // this.waitForOptionsMillisecondsInput.value = settings.waitForOptionsMilliseconds.toString();
      // Note: autoFillProgressDialogMode is not in SystemSettingsViewModel
      // Note: logLevel is not in SystemSettingsViewModel
      // this.logLevelSelect.value = settings.logLevel.toString();

      // Tab recording settings
      this.enableTabRecordingInput.checked = settings.recordingEnabled;
      // Note: enableAudioRecording is not in SystemSettingsViewModel
      // this.enableAudioRecordingInput.checked = settings.enableAudioRecording;
      this.recordingBitrateInput.value = (settings.recordingBitrate / 1000).toString(); // bps to kbps
      this.recordingRetentionDaysInput.value = settings.recordingRetentionDays.toString();

      // Gradient settings with default values
      const startColor = settings.gradientStartColor || '#4F46E5';
      const endColor = settings.gradientEndColor || '#7C3AED';
      const angle = settings.gradientAngle || 135;

      this.logger.debug('Loading gradient values into popup settings modal:', {
        startColor,
        endColor,
        angle,
      });

      this.gradientStartColorInput.value = startColor;
      this.gradientStartColorTextInput.value = startColor;
      this.gradientEndColorInput.value = endColor;
      this.gradientEndColorTextInput.value = endColor;
      this.gradientAngleInput.value = angle.toString();
      this.gradientAngleDisplay.textContent = `${angle}°`;

      this.logger.debug('Gradient values set to popup modal form fields successfully');

      this.settingsModal.classList.add('show');
    } catch (error) {
      this.logger.error('Failed to load settings', error);
      alert(I18nAdapter.getMessage('settingsLoadFailed'));
    }
  }

  /**
   * Load settings with retry mechanism
   */
  private async loadSettingsWithRetry(retries: number = 3): Promise<SystemSettingsViewModel> {
    for (let i = 0; i < retries; i++) {
      try {
        // Wait a bit to ensure chrome.storage is fully ready
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100 * i));
          this.logger.debug(`Retry attempt ${i + 1} to load settings for popup modal`);
        }

        const settingsResult = await this.systemSettingsRepository.load();
        if (settingsResult.isFailure) {
          throw new Error(
            `Failed to load settings: ${settingsResult.error?.message || 'Unknown error'}`
          );
        }

        const settingsCollection = settingsResult.value!;

        // Convert to ViewModel
        const settingsDto = SystemSettingsMapper.toOutputDto(settingsCollection);
        const settings = ViewModelMapper.toSystemSettingsViewModel(settingsDto);

        // Log the loaded settings
        this.logger.debug('Settings loaded successfully for popup modal:', {
          gradientStartColor: settings.gradientStartColor,
          gradientEndColor: settings.gradientEndColor,
          gradientAngle: settings.gradientAngle,
        });

        return settings;
      } catch (error) {
        this.logger.warn(`Failed to load settings on attempt ${i + 1}`, { error });
        if (i === retries - 1) {
          throw error;
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to load settings after all retries');
  }

  /**
   * Close settings modal
   */
  closeSettingsModal(): void {
    this.settingsModal.classList.remove('show');
  }

  /**
   * Save settings from form
   */
  async saveSettings(): Promise<void> {
    try {
      const retryWaitSecondsMin = parseInt(this.retryWaitSecondsMinInput.value);
      const retryWaitSecondsMax = parseInt(this.retryWaitSecondsMaxInput.value);
      const retryCount = parseInt(this.retryCountInput.value);
      const waitForOptionsMilliseconds = parseInt(this.waitForOptionsMillisecondsInput.value);
      const autoFillProgressDialogMode = this.autoFillProgressDialogModeSelect.value as
        | 'withCancel'
        | 'withoutCancel'
        | 'hidden';
      const logLevel = parseInt(this.logLevelSelect.value);

      // Tab recording settings
      const enableTabRecording = this.enableTabRecordingInput.checked;
      const enableAudioRecording = this.enableAudioRecordingInput.checked;
      const recordingBitrate = parseFloat(this.recordingBitrateInput.value) * 1000; // Convert kbps to bps
      const recordingRetentionDays = parseInt(this.recordingRetentionDaysInput.value);

      // Gradient background settings
      const gradientStartColor = this.gradientStartColorTextInput.value;
      const gradientEndColor = this.gradientEndColorTextInput.value;
      const gradientAngle = parseInt(this.gradientAngleInput.value);

      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin,
        retryWaitSecondsMax,
        retryCount,
        waitForOptionsMilliseconds,
        autoFillProgressDialogMode,
        logLevel,
        enableTabRecording,
        enableAudioRecording,
        recordingBitrate,
        recordingRetentionDays,
        gradientStartColor,
        gradientEndColor,
        gradientAngle,
      });

      await this.systemSettingsRepository.save(settings);

      // Apply gradient background immediately
      this.applyGradientBackground(gradientStartColor, gradientEndColor, gradientAngle);

      this.closeSettingsModal();
      alert(I18nAdapter.getMessage('systemSettingsSaved'));
    } catch (error) {
      this.logger.error('Failed to save settings', error);
      alert(I18nAdapter.getMessage('systemSettingsSaveFailed'));
    }
  }

  /**
   * Apply gradient background to popup body
   */
  private applyGradientBackground(startColor: string, endColor: string, angle: number): void {
    try {
      const gradient = `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
      document.body.style.background = gradient;

      this.logger.debug('Applied gradient background', { startColor, endColor, angle });
    } catch (error) {
      this.logger.error('Failed to apply gradient background', error);
    }
  }

  /**
   * Reset settings to default values
   */
  async resetSettings(): Promise<void> {
    // Confirm before resetting
    if (!confirm(I18nAdapter.getMessage('confirmResetSettings'))) {
      return;
    }

    try {
      // Create default settings
      const defaultSettings = new SystemSettingsCollection();

      // Save to storage
      await this.systemSettingsRepository.save(defaultSettings);

      // Apply default gradient immediately
      this.applyGradientBackground(
        defaultSettings.getGradientStartColor(),
        defaultSettings.getGradientEndColor(),
        defaultSettings.getGradientAngle()
      );

      // Repopulate form with default values
      this.retryWaitSecondsMinInput.value = defaultSettings.getRetryWaitSecondsMin().toString();
      this.retryWaitSecondsMaxInput.value = defaultSettings.getRetryWaitSecondsMax().toString();
      this.retryCountInput.value = defaultSettings.getRetryCount().toString();
      this.waitForOptionsMillisecondsInput.value = defaultSettings
        .getWaitForOptionsMilliseconds()
        .toString();
      this.autoFillProgressDialogModeSelect.value = defaultSettings.getAutoFillProgressDialogMode();
      this.logLevelSelect.value = defaultSettings.getLogLevel().toString();

      // Tab recording settings
      this.enableTabRecordingInput.checked = defaultSettings.getEnableTabRecording();
      this.enableAudioRecordingInput.checked = defaultSettings.getEnableAudioRecording();
      this.recordingBitrateInput.value = (defaultSettings.getRecordingBitrate() / 1000).toString(); // bps to kbps
      this.recordingRetentionDaysInput.value = defaultSettings
        .getRecordingRetentionDays()
        .toString();

      // Gradient background settings
      const startColor = defaultSettings.getGradientStartColor();
      const endColor = defaultSettings.getGradientEndColor();
      const angle = defaultSettings.getGradientAngle();
      this.gradientStartColorInput.value = startColor;
      this.gradientStartColorTextInput.value = startColor;
      this.gradientEndColorInput.value = endColor;
      this.gradientEndColorTextInput.value = endColor;
      this.gradientAngleInput.value = angle.toString();
      this.gradientAngleDisplay.textContent = `${angle}°`;

      alert(I18nAdapter.getMessage('settingsResetCompleted'));
    } catch (error) {
      this.logger.error('Failed to reset settings', error);
      alert(I18nAdapter.getMessage('settingsResetFailed'));
    }
  }
}
