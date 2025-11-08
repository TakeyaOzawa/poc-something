/**
 * Presentation Layer: System Settings Presenter
 * Coordinates business logic for system settings management
 */

import { Logger } from '@domain/types/logger.types';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@usecases/storage/ExecuteStorageSyncUseCase';
import {
  ListSyncConfigsUseCase,
  ListSyncConfigsOutput,
} from '@usecases/sync/ListSyncConfigsUseCase';
import { ExecuteManualSyncOutput } from '@usecases/sync/ExecuteManualSyncUseCase';
import { SystemSettingsViewModel } from '../types/SystemSettingsViewModel';
import { StorageSyncConfigViewModel } from '../types/StorageSyncConfigViewModel';
import { ViewModelMapper } from '../mappers/ViewModelMapper';

export interface SystemSettingsView {
  showSuccess(message: string): void;
  showError(message: string): void;
  showLoading(): void;
  hideLoading(): void;
  updateGeneralSettings(settings: SystemSettingsViewModel): void;
  updateRecordingSettings(settings: SystemSettingsViewModel): void;
  updateAppearanceSettings(settings: SystemSettingsViewModel): void;
  applyGradientBackground(startColor: string, endColor: string, angle: number): void;
}

export class SystemSettingsPresenter {
  private settings: SystemSettingsViewModel | null = null;

  // eslint-disable-next-line max-params
  constructor(
    private view: SystemSettingsView,
    private getSystemSettingsUseCase: GetSystemSettingsUseCase,
    private updateSystemSettingsUseCase: UpdateSystemSettingsUseCase,
    private resetSystemSettingsUseCase: ResetSystemSettingsUseCase,
    private exportSystemSettingsUseCase: ExportSystemSettingsUseCase,
    private importSystemSettingsUseCase: ImportSystemSettingsUseCase,
    private executeStorageSyncUseCase: ExecuteStorageSyncUseCase,
    private getAllStorageSyncConfigsUseCase: ListSyncConfigsUseCase,
    private logger: Logger
  ) {}

  /**
   * Load all settings and update views
   */
  async loadAllSettings(): Promise<void> {
    try {
      this.view.showLoading();
      const result = await this.getSystemSettingsUseCase.execute();

      if (result.isFailure) {
        throw new Error(`Failed to load settings: ${result.error?.message}`);
      }

      const settingsDto = result.value!;
      const settingsViewModel = ViewModelMapper.toSystemSettingsViewModel(settingsDto);

      this.view.updateGeneralSettings(settingsViewModel);
      this.view.updateRecordingSettings(settingsViewModel);
      this.view.updateAppearanceSettings(settingsViewModel);

      // Apply gradient background with default values
      this.view.applyGradientBackground('#4F46E5', '#7C3AED', 135);
    } catch (error) {
      this.logger.error('Failed to load settings', error);
      this.view.showError(I18nAdapter.getMessage('settingsLoadFailed'));
    } finally {
      this.view.hideLoading();
    }
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
  async saveGeneralSettings(updates: Partial<SystemSettings>): Promise<void> {
    try {
      if (!this.settings) {
        throw new Error('Settings not loaded');
      }

      const updatedSettings = new SystemSettingsCollection({
        ...this.settings.getAll(),
        ...(updates as any),
      });
      const result = await this.updateSystemSettingsUseCase.execute({ settings: updatedSettings });

      if (result.isFailure) {
        throw result.error;
      }

      this.settings = updatedSettings;

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
  async saveRecordingSettings(updates: Partial<SystemSettings>): Promise<void> {
    try {
      if (!this.settings) {
        throw new Error('Settings not loaded');
      }

      const updatedSettings = new SystemSettingsCollection({
        ...this.settings.getAll(),
        ...(updates as any),
      });
      const result = await this.updateSystemSettingsUseCase.execute({ settings: updatedSettings });

      if (result.isFailure) {
        throw result.error;
      }

      this.settings = updatedSettings;

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
  async saveAppearanceSettings(updates: Partial<SystemSettings>): Promise<void> {
    try {
      if (!this.settings) {
        throw new Error('Settings not loaded');
      }

      const updatedSettings = new SystemSettingsCollection({
        ...this.settings.getAll(),
        ...(updates as any),
      });
      const result = await this.updateSystemSettingsUseCase.execute({ settings: updatedSettings });

      if (result.isFailure) {
        throw result.error;
      }

      this.settings = updatedSettings;

      // Apply new gradient immediately
      this.view.applyGradientBackground(
        updatedSettings.getGradientStartColor(),
        updatedSettings.getGradientEndColor(),
        updatedSettings.getGradientAngle()
      );

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
   * Reset general settings to defaults
   */
  async resetGeneralSettings(): Promise<void> {
    try {
      if (!confirm(I18nAdapter.getMessage('confirmResetGeneral'))) {
        return;
      }

      const result = await this.resetSystemSettingsUseCase.execute({ section: 'general' });

      if (result.isFailure) {
        throw result.error;
      }

      const resetSettings = result.value!;
      this.settings = resetSettings;
      this.view.updateGeneralSettings(resetSettings);
      this.view.showSuccess(I18nAdapter.getMessage('generalSettingsReset'));
    } catch (error) {
      this.logger.error('Failed to reset general settings', error);
      this.view.showError(I18nAdapter.getMessage('settingsResetFailed'));
      throw error;
    }
  }

  /**
   * Reset recording settings to defaults
   */
  async resetRecordingSettings(): Promise<void> {
    try {
      if (!confirm(I18nAdapter.getMessage('confirmResetRecording'))) {
        return;
      }

      const result = await this.resetSystemSettingsUseCase.execute({ section: 'recording' });

      if (result.isFailure) {
        throw result.error;
      }

      const resetSettings = result.value!;
      this.settings = resetSettings;
      this.view.updateRecordingSettings(resetSettings);
      this.view.showSuccess(I18nAdapter.getMessage('recordingSettingsReset'));
    } catch (error) {
      this.logger.error('Failed to reset recording settings', error);
      this.view.showError(I18nAdapter.getMessage('settingsResetFailed'));
      throw error;
    }
  }

  /**
   * Reset appearance settings to defaults
   */
  async resetAppearanceSettings(): Promise<void> {
    try {
      if (!confirm(I18nAdapter.getMessage('confirmResetAppearance'))) {
        return;
      }

      const result = await this.resetSystemSettingsUseCase.execute({
        section: 'appearance',
      });

      if (result.isFailure) {
        throw result.error;
      }

      const resetSettings = result.value!;
      this.settings = resetSettings;
      this.view.updateAppearanceSettings(resetSettings);

      // Apply default gradient
      this.view.applyGradientBackground(
        resetSettings.getGradientStartColor(),
        resetSettings.getGradientEndColor(),
        resetSettings.getGradientAngle()
      );

      this.view.showSuccess(I18nAdapter.getMessage('appearanceSettingsReset'));
    } catch (error) {
      this.logger.error('Failed to reset appearance settings', error);
      this.view.showError(I18nAdapter.getMessage('settingsResetFailed'));
      throw error;
    }
  }

  /**
   * Execute sync for a specific storage key
   */
  async executeSingleSync(storageKey: string): Promise<ExecuteManualSyncOutput | null> {
    try {
      const result = await this.getAllStorageSyncConfigsUseCase.execute({});

      if (!result.success || !result.configs) {
        this.logger.error('Failed to load sync configurations');
        return null;
      }

      const config = result.configs.find((c) => c.storageKey === storageKey);

      if (!config) {
        this.logger.warn(`No sync config found for storage key: ${storageKey}`);
        return null;
      }

      return await this.executeStorageSyncUseCase.execute({ storageKey });
    } catch (error) {
      this.logger.error(`Failed to execute sync for ${storageKey}`, error);
      throw error;
    }
  }

  /**
   * Execute all configured syncs
   */
  async executeAllSyncs(): Promise<{ success: string[]; failed: string[] }> {
    try {
      const result = await this.getAllStorageSyncConfigsUseCase.execute({});

      if (!result.success || !result.configs) {
        this.logger.error('Failed to load sync configurations');
        return { success: [], failed: [] };
      }

      const results: { success: string[]; failed: string[] } = {
        success: [],
        failed: [],
      };

      for (const config of result.configs) {
        const storageKey = config.storageKey;
        try {
          const result = await this.executeStorageSyncUseCase.execute({ storageKey });
          if (result.success) {
            results.success.push(storageKey);
          } else {
            results.failed.push(storageKey);
          }
        } catch (error) {
          this.logger.error(`Sync failed for ${storageKey}`, error);
          results.failed.push(storageKey);
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to execute all syncs', error);
      throw error;
    }
  }

  /**
   * Export system settings as CSV
   */
  async exportSettings(): Promise<string> {
    try {
      const result = await this.exportSystemSettingsUseCase.execute();

      if (result.isFailure) {
        throw result.error;
      }

      return result.value!;
    } catch (error) {
      this.logger.error('Failed to export settings', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  /**
   * Import system settings from CSV
   */
  async importSettings(csvText: string): Promise<void> {
    try {
      const result = await this.importSystemSettingsUseCase.execute({ csvText });

      if (result.isFailure) {
        throw result.error;
      }

      await this.loadAllSettings();
      this.view.showSuccess(I18nAdapter.getMessage('importSuccess'));
    } catch (error) {
      this.logger.error('Failed to import settings', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.view.showError(I18nAdapter.format('importFailed', errorMessage));
      throw error;
    }
  }
}
