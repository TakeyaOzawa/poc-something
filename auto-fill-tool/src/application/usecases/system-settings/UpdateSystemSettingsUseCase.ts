/**
 * Use Case Layer: Update System Settings
 * Updates system settings in the repository
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { UpdateSystemSettingsInputDto } from '@application/dtos/UpdateSystemSettingsInputDto';

export interface UpdateSystemSettingsInput {
  settings: UpdateSystemSettingsInputDto;
}

export class UpdateSystemSettingsUseCase {
  constructor(private repository: SystemSettingsRepository) {}

  async execute(input: UpdateSystemSettingsInput): Promise<Result<void, Error>> {
    // Load current settings
    const currentResult = await this.repository.load();
    if (currentResult.isFailure) {
      return Result.failure(
        new Error(`Failed to load current settings: ${currentResult.error?.message}`)
      );
    }

    const currentSettings = currentResult.value!;

    // Create updated settings by merging DTO values with current settings
    let updatedSettings = new SystemSettingsCollection({
      ...currentSettings.getAll(),
    });

    // Apply updates from DTO
    const dto = input.settings;

    // General Settings
    if (dto.retryWaitSecondsMin !== undefined && dto.retryWaitSecondsMax !== undefined) {
      const rangeResult = updatedSettings.withRetryWaitSecondsRange(
        dto.retryWaitSecondsMin,
        dto.retryWaitSecondsMax
      );
      if (rangeResult.isFailure) {
        return Result.failure(rangeResult.error!);
      }
      updatedSettings = rangeResult.value!;
    } else if (dto.retryWaitSecondsMin !== undefined) {
      // If setting min to a value greater than current max, adjust max to match min
      const currentMax = updatedSettings.getRetryWaitSecondsMax();
      if (dto.retryWaitSecondsMin > currentMax) {
        const rangeResult = updatedSettings.withRetryWaitSecondsRange(
          dto.retryWaitSecondsMin,
          dto.retryWaitSecondsMin
        );
        if (rangeResult.isFailure) {
          return Result.failure(rangeResult.error!);
        }
        updatedSettings = rangeResult.value!;
      } else {
        const minResult = updatedSettings.withRetryWaitSecondsMin(dto.retryWaitSecondsMin);
        if (minResult.isFailure) {
          return Result.failure(minResult.error!);
        }
        updatedSettings = minResult.value!;
      }
    } else if (dto.retryWaitSecondsMax !== undefined) {
      // If setting max to a value less than current min, adjust min to match max
      const currentMin = updatedSettings.getRetryWaitSecondsMin();
      if (dto.retryWaitSecondsMax < currentMin) {
        const rangeResult = updatedSettings.withRetryWaitSecondsRange(
          dto.retryWaitSecondsMax,
          dto.retryWaitSecondsMax
        );
        if (rangeResult.isFailure) {
          return Result.failure(rangeResult.error!);
        }
        updatedSettings = rangeResult.value!;
      } else {
        const maxResult = updatedSettings.withRetryWaitSecondsMax(dto.retryWaitSecondsMax);
        if (maxResult.isFailure) {
          return Result.failure(maxResult.error!);
        }
        updatedSettings = maxResult.value!;
      }
    }

    if (dto.retryCount !== undefined) {
      const result = updatedSettings.withRetryCount(dto.retryCount);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.autoFillProgressDialogMode !== undefined) {
      const result = updatedSettings.withAutoFillProgressDialogMode(dto.autoFillProgressDialogMode);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.waitForOptionsMilliseconds !== undefined) {
      const result = updatedSettings.withWaitForOptionsMilliseconds(dto.waitForOptionsMilliseconds);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.logLevel !== undefined) {
      const result = updatedSettings.withLogLevel(dto.logLevel);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    // Tab Recording Settings
    if (dto.enableTabRecording !== undefined) {
      const result = updatedSettings.withEnableTabRecording(dto.enableTabRecording);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.enableAudioRecording !== undefined) {
      const result = updatedSettings.withEnableAudioRecording(dto.enableAudioRecording);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.recordingBitrate !== undefined) {
      const result = updatedSettings.withRecordingBitrate(dto.recordingBitrate);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.recordingRetentionDays !== undefined) {
      const result = updatedSettings.withRecordingRetentionDays(dto.recordingRetentionDays);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    // Gradient Background Settings
    if (dto.gradientStartColor !== undefined) {
      const result = updatedSettings.withGradientStartColor(dto.gradientStartColor);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.gradientEndColor !== undefined) {
      const result = updatedSettings.withGradientEndColor(dto.gradientEndColor);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.gradientAngle !== undefined) {
      const result = updatedSettings.withGradientAngle(dto.gradientAngle);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    // Centralized Logging Settings
    if (dto.enabledLogSources !== undefined) {
      const result = updatedSettings.withEnabledLogSources(dto.enabledLogSources);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.securityEventsOnly !== undefined) {
      const result = updatedSettings.withSecurityEventsOnly(dto.securityEventsOnly);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.maxStoredLogs !== undefined) {
      const result = updatedSettings.withMaxStoredLogs(dto.maxStoredLogs);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    if (dto.logRetentionDays !== undefined) {
      const result = updatedSettings.withLogRetentionDays(dto.logRetentionDays);
      if (result.isFailure) {
        return Result.failure(result.error!);
      }
      updatedSettings = result.value!;
    }

    // Save the updated settings
    const saveResult = await this.repository.save(updatedSettings);

    if (saveResult.isFailure) {
      return Result.failure(
        new Error(`Failed to update system settings: ${saveResult.error?.message}`)
      );
    }

    return Result.success(undefined);
  }
}
