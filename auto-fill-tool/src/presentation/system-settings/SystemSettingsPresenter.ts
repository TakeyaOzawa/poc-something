/**
 * Presentation Layer: System Settings Presenter
 * Coordinates business logic for system settings management
 */

import { Logger } from '@domain/types/logger.types';
import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { GetSystemSettingsUseCase } from '@application/usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@application/usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@application/usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@application/usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@application/usecases/storage/ExecuteStorageSyncUseCase';
import { ListSyncConfigsUseCase } from '@application/usecases/sync/ListSyncConfigsUseCase';
import { ExecuteManualSyncOutput } from '@application/usecases/sync/ExecuteManualSyncUseCase';
import { SystemSettingsViewModel } from '../types/SystemSettingsViewModel';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { SystemSettingsMapper } from '@application/mappers/SystemSettingsMapper';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';

export interface SystemSettingsView {
  showLoading(): void;
  hideLoading(): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  updateGeneralSettings(settings: SystemSettingsViewModel): void;
  updateRecordingSettings(settings: SystemSettingsViewModel): void;
  updateAppearanceSettings(settings: SystemSettingsViewModel): void;
  applyGradientBackground(startColor: string, endColor: string, angle: number): void;
}

export class SystemSettingsPresenter {
  private logger: Logger;
  private settings: SystemSettingsViewModel | null = null;

  constructor(
    private view: SystemSettingsView,
    private getSystemSettingsUseCase: GetSystemSettingsUseCase,
    private updateSystemSettingsUseCase: UpdateSystemSettingsUseCase,
    private resetSystemSettingsUseCase: ResetSystemSettingsUseCase,
    private exportSystemSettingsUseCase: ExportSystemSettingsUseCase,
    private importSystemSettingsUseCase: ImportSystemSettingsUseCase,
    private executeStorageSyncUseCase: ExecuteStorageSyncUseCase,
    private listSyncConfigsUseCase: ListSyncConfigsUseCase,
    logger?: Logger
  ) {
    this.logger = logger || LoggerFactory.createLogger('SystemSettingsPresenter');
  }

  /**
   * Load and display system settings
   */
  async loadSettings(): Promise<void> {
    try {
      this.view.showLoading();
      const result = await this.getSystemSettingsUseCase.execute();

      if (result.isFailure) {
        throw new Error(`Failed to load settings: ${result.error}`);
      }

      const settingsCollection = result.value!;
      const settingsDto = SystemSettingsMapper.toOutputDto(settingsCollection);
      const settingsViewModel = ViewModelMapper.toSystemSettingsViewModel(settingsDto);

      this.settings = settingsViewModel;

      this.view.updateGeneralSettings(settingsViewModel);
      this.view.updateRecordingSettings(settingsViewModel);
      this.view.updateAppearanceSettings(settingsViewModel);

      this.view.hideLoading();
    } catch (error) {
      this.logger.error('Failed to load settings', error);
      this.view.hideLoading();
      this.view.showError(
        I18nAdapter.format(
          'settingsLoadFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      throw error;
    }
  }

  /**
   * Alias for loadSettings to match interface requirements
   */
  async loadAllSettings(): Promise<void> {
    return this.loadSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): SystemSettingsViewModel | null {
    return this.settings;
  }

  /**
   * Save general settings
   */
  async saveGeneralSettings(updates: Partial<SystemSettingsViewModel>): Promise<void> {
    try {
      if (!this.settings) {
        throw new Error('Settings not loaded');
      }

      // Create SystemSettingsCollection from updates
      const currentResult = await this.getSystemSettingsUseCase.execute();
      if (currentResult.isFailure) {
        throw new Error('Failed to load current settings');
      }

      const currentSettings = currentResult.value!;
      const updatedSettings = new SystemSettingsCollection({
        ...currentSettings.getAll(),
        retryWaitSecondsMin:
          updates.retryWaitSecondsMin ?? currentSettings.getRetryWaitSecondsMin(),
        retryWaitSecondsMax:
          updates.retryWaitSecondsMax ?? currentSettings.getRetryWaitSecondsMax(),
        retryCount: updates.retryCount ?? currentSettings.getRetryCount(),
        enableTabRecording: updates.recordingEnabled ?? currentSettings.getEnableTabRecording(),
        recordingBitrate: updates.recordingBitrate ?? currentSettings.getRecordingBitrate(),
        recordingRetentionDays:
          updates.recordingRetentionDays ?? currentSettings.getRecordingRetentionDays(),
        enabledLogSources: updates.enabledLogSources ?? currentSettings.getEnabledLogSources(),
        securityEventsOnly: updates.securityEventsOnly ?? currentSettings.getSecurityEventsOnly(),
        maxStoredLogs: updates.maxStoredLogs ?? currentSettings.getMaxStoredLogs(),
        logRetentionDays: updates.logRetentionDays ?? currentSettings.getLogRetentionDays(),
      });

      const result = await this.updateSystemSettingsUseCase.execute({ settings: updatedSettings });

      if (result.isFailure) {
        throw result.error;
      }

      await this.loadSettings();

      this.view.showSuccess(I18nAdapter.getMessage('generalSettingsSaved'));
    } catch (error) {
      this.logger.error('Failed to save general settings', error);
      this.view.showError(
        I18nAdapter.format(
          'settingsSaveFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      throw error;
    }
  }

  /**
   * Save recording settings
   */
  async saveRecordingSettings(updates: Partial<SystemSettingsViewModel>): Promise<void> {
    try {
      if (!this.settings) {
        throw new Error('Settings not loaded');
      }

      const currentResult = await this.getSystemSettingsUseCase.execute();
      if (currentResult.isFailure) {
        throw new Error('Failed to load current settings');
      }

      const currentSettings = currentResult.value!;
      const updatedSettings = new SystemSettingsCollection({
        ...currentSettings.getAll(),
        enableTabRecording: updates.recordingEnabled ?? currentSettings.getEnableTabRecording(),
        recordingBitrate: updates.recordingBitrate ?? currentSettings.getRecordingBitrate(),
        recordingRetentionDays:
          updates.recordingRetentionDays ?? currentSettings.getRecordingRetentionDays(),
      });

      const result = await this.updateSystemSettingsUseCase.execute({ settings: updatedSettings });

      if (result.isFailure) {
        throw result.error;
      }

      await this.loadSettings();

      this.view.showSuccess(I18nAdapter.getMessage('recordingSettingsSaved'));
    } catch (error) {
      this.logger.error('Failed to save recording settings', error);
      this.view.showError(
        I18nAdapter.format(
          'settingsSaveFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      throw error;
    }
  }

  /**
   * Save appearance settings
   */
  async saveAppearanceSettings(_updates: Partial<SystemSettingsViewModel>): Promise<void> {
    try {
      if (!this.settings) {
        throw new Error('Settings not loaded');
      }

      const currentResult = await this.getSystemSettingsUseCase.execute();
      if (currentResult.isFailure) {
        throw new Error('Failed to load current settings');
      }

      const currentSettings = currentResult.value!;
      const result = await this.updateSystemSettingsUseCase.execute({ settings: currentSettings });

      if (result.isFailure) {
        throw result.error;
      }

      await this.loadSettings();

      this.view.showSuccess(I18nAdapter.getMessage('appearanceSettingsSaved'));
    } catch (error) {
      this.logger.error('Failed to save appearance settings', error);
      this.view.showError(
        I18nAdapter.format(
          'settingsSaveFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      if (!confirm(I18nAdapter.getMessage('confirmResetSettings'))) {
        return;
      }

      const result = await this.resetSystemSettingsUseCase.execute();

      if (result.isFailure) {
        throw result.error;
      }

      await this.loadSettings();

      this.view.showSuccess(
        I18nAdapter.getMessage('settingsResetCompleted') || 'Settings reset successfully'
      );
    } catch (error) {
      this.logger.error('Failed to reset settings', error);
      this.view.showError(
        I18nAdapter.format(
          'settingsResetFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      throw error;
    }
  }

  /**
   * Export settings
   */
  async exportSettings(): Promise<string> {
    try {
      const result = await this.exportSystemSettingsUseCase.execute();

      if (result.isFailure) {
        throw result.error;
      }

      const exportedData = result.value!;

      // Download the exported data
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.view.showSuccess(I18nAdapter.getMessage('export') || 'Settings exported successfully');

      return exportedData;
    } catch (error) {
      this.logger.error('Failed to export settings', error);
      this.view.showError(
        I18nAdapter.format(
          'exportFailed',
          error instanceof Error ? error.message : 'Unknown error'
        ) || `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Import settings
   */
  async importSettings(file: File): Promise<void> {
    try {
      const text = await file.text();
      const result = await this.importSystemSettingsUseCase.execute({ csvText: text });

      if (result.isFailure) {
        throw result.error;
      }

      await this.loadSettings();

      this.view.showSuccess(
        I18nAdapter.getMessage('importSuccess') || 'Settings imported successfully'
      );
    } catch (error) {
      this.logger.error('Failed to import settings', error);
      this.view.showError(
        I18nAdapter.format(
          'importFailed',
          error instanceof Error ? error.message : 'Unknown error'
        ) || `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Execute data sync
   */
  async executeDataSync(): Promise<ExecuteManualSyncOutput> {
    try {
      const result = await this.executeStorageSyncUseCase.execute({ storageKey: 'all' });

      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      this.view.showSuccess(I18nAdapter.getMessage('syncCompleted') || 'Data sync completed');
      return result;
    } catch (error) {
      this.logger.error('Failed to execute data sync', error);
      this.view.showError(
        I18nAdapter.format(
          'syncFailed',
          error instanceof Error ? error.message : 'Unknown error'
        ) || `Data sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}
