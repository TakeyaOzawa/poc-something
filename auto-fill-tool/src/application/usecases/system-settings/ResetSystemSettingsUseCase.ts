/**
 * Use Case Layer: Reset System Settings
 * Resets system settings to defaults
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';

export interface ResetSystemSettingsInput {
  section?: 'general' | 'recording' | 'appearance';
}

export class ResetSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(
    input: ResetSystemSettingsInput = {}
  ): Promise<Result<SystemSettingsCollection, Error>> {
    // Load current settings
    const loadResult = await this.repository.load();

    if (loadResult.isFailure) {
      return Result.failure(
        new Error(`Failed to reset system settings: ${loadResult.error?.message}`)
      );
    }

    const currentSettings = loadResult.value!;

    // Create new settings with defaults for the specified section
    let updatedSettings: SystemSettingsCollection;

    if (input.section === 'general') {
      // Reset general settings to defaults
      updatedSettings = new SystemSettingsCollection({
        ...currentSettings.getAll(),
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: 1, // INFO
      });
    } else if (input.section === 'recording') {
      // Reset recording settings to defaults
      updatedSettings = new SystemSettingsCollection({
        ...currentSettings.getAll(),
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
      });
    } else if (input.section === 'appearance') {
      // Reset appearance settings to defaults
      updatedSettings = new SystemSettingsCollection({
        ...currentSettings.getAll(),
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
      });
    } else {
      // Reset all settings
      updatedSettings = new SystemSettingsCollection();
    }

    const saveResult = await this.repository.save(updatedSettings);

    if (saveResult.isFailure) {
      return Result.failure(
        new Error(`Failed to reset system settings: ${saveResult.error?.message}`)
      );
    }

    return Result.success(updatedSettings);
  }
}
