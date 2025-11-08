/**
 * Use Case: Export Storage Sync Configurations to CSV
 * Returns CSV string for download
 */

import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { StorageSyncConfigMapper } from '@application/mappers/StorageSyncConfigMapper';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface ExportStorageSyncConfigsInput {}

export class ExportStorageSyncConfigsUseCase {
  constructor(
    private storageSyncConfigRepository: StorageSyncConfigRepository,
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
        return this.createEmptyCSV();
      }

      // Convert entities to DTOs
      const dtos = configs.map((config) => StorageSyncConfigMapper.toOutputDto(config));

      // Convert DTOs to CSV
      const csv = this.convertToCSV(dtos);

      this.logger.info('Successfully exported storage sync configurations', {
        count: configs.length,
      });

      return csv;
    } catch (error) {
      this.logger.error('Failed to export storage sync configurations', error);
      throw error;
    }
  }

  private convertToCSV(dtos: any[]): string {
    if (dtos.length === 0) {
      return this.createEmptyCSV();
    }

    const headers = Object.keys(dtos[0]);
    const rows = dtos.map((dto) =>
      headers
        .map((header) => {
          const value = dto[header];
          if (typeof value === 'string') return `"${value}"`;
          if (Array.isArray(value)) return `"${JSON.stringify(value)}"`;
          if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
          return value;
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private createEmptyCSV(): string {
    const headers = [
      'id',
      'storageKey',
      'enabled',
      'syncMethod',
      'syncTiming',
      'syncIntervalSeconds',
      'syncDirection',
      'conflictResolution',
      'lastSyncDate',
      'lastSyncStatus',
      'createdAt',
      'updatedAt',
    ];
    return headers.join(',') + '\n';
  }
}
