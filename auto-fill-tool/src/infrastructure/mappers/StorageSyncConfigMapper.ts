/**
 * Infrastructure Layer: Storage Sync Config Mapper
 * Handles serialization of StorageSyncConfig to CSV format
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

export class StorageSyncConfigMapper {
  /**
   * Convert array of StorageSyncConfig to CSV string
   */
  static toCSV(configs: StorageSyncConfig[], logger: Logger = new NoOpLogger()): string {
    try {
      // CSV Header
      const header =
        'id,storageKey,enabled,syncMethod,syncTiming,syncIntervalSeconds,' +
        'syncDirection,conflictResolution,inputs,outputs,lastSyncDate,lastSyncStatus,' +
        'createdAt,updatedAt';

      // CSV Rows
      const rows = configs.map((config) => {
        const data = config.toData();
        return [
          this.escapeCSV(data.id),
          this.escapeCSV(data.storageKey),
          data.enabled.toString(),
          this.escapeCSV(data.syncMethod),
          this.escapeCSV(data.syncTiming),
          data.syncIntervalSeconds?.toString() || '',
          this.escapeCSV(data.syncDirection),
          this.escapeCSV(data.conflictResolution),
          this.escapeCSV(JSON.stringify(data.inputs)),
          this.escapeCSV(JSON.stringify(data.outputs)),
          data.lastSyncDate || '',
          data.lastSyncStatus || '',
          data.createdAt,
          data.updatedAt,
        ].join(',');
      });

      return [header, ...rows].join('\n');
    } catch (error) {
      logger.error('Failed to convert storage sync configs to CSV', error);
      throw error;
    }
  }

  /**
   * Escape CSV values
   */
  private static escapeCSV(value: string): string {
    if (!value) return '';

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    const escaped = value.replace(/"/g, '""');

    return needsQuotes ? `"${escaped}"` : escaped;
  }
}
