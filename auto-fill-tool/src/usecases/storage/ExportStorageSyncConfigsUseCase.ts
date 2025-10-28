/**
 * Use Case: Export Storage Sync Configurations to CSV
 * Returns CSV string for download
 */

import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface ExportStorageSyncConfigsInput {}

export class ExportStorageSyncConfigsUseCase {
  constructor(
    private storageSyncConfigRepository: StorageSyncConfigRepository,
    private mapper: StorageSyncConfigMapper,
    private logger: Logger = new NoOpLogger()
  ) {}

  async execute(_input: ExportStorageSyncConfigsInput = {}): Promise<string> {
    this.logger.info('Exporting storage sync configurations');

    try {
      // Load all sync configurations
      const configsResult = await this.storageSyncConfigRepository.loadAll();
      if (configsResult.isFailure) {
        this.logger.error('Failed to export storage sync configurations', configsResult.error);
        throw new Error(configsResult.error!.message);
      }

      const configs = configsResult.value!;

      if (!configs || configs.length === 0) {
        this.logger.warn('No storage sync configurations found to export');
        // Return empty CSV with header only
        return (
          'id,storageKey,enabled,syncMethod,syncTiming,syncIntervalSeconds,' +
          'syncDirection,conflictResolution,lastSyncDate,lastSyncStatus,' +
          'createdAt,updatedAt'
        );
      }

      // Convert to CSV
      const csv = StorageSyncConfigMapper.toCSV(configs, this.logger);

      this.logger.info('Successfully exported storage sync configurations', {
        count: configs.length,
      });

      return csv;
    } catch (error) {
      this.logger.error('Failed to export storage sync configurations', error);
      throw error;
    }
  }
}
