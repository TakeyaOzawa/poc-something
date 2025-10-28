/**
 * Use Case: Delete Old Recordings
 * Deletes old recordings to maintain retention policy
 */

import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { Logger } from '@domain/types/logger.types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DeleteOldRecordingsInput {}

export class DeleteOldRecordingsUseCase {
  constructor(
    private recordingRepository: RecordingStorageRepository,
    private systemSettingsRepository: SystemSettingsRepository,
    private logger: Logger
  ) {}

  async execute(_input: DeleteOldRecordingsInput): Promise<number> {
    const settingsResult = await this.systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(
        `Failed to load system settings: ${settingsResult.error?.message || 'Unknown error'}`
      );
    }

    const settings = settingsResult.value!;
    const retentionDays = settings.getRecordingRetentionDays();

    const deleteResult = await this.recordingRepository.deleteOldRecordings(retentionDays);
    if (deleteResult.isFailure) {
      throw new Error(
        `Failed to delete old recordings: ${deleteResult.error?.message || 'Unknown error'}`
      );
    }

    const deletedCount = deleteResult.value!;

    this.logger.info('Old recordings deleted', {
      deletedCount,
      retentionDays,
    });

    return deletedCount;
  }
}
