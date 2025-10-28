/**
 * Application Layer: Cleanup Sync Histories Use Case
 * Deletes old sync history records
 */

import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { Logger } from '@domain/types/logger.types';

export interface CleanupSyncHistoriesInput {
  olderThanDays: number;
}

export interface CleanupSyncHistoriesOutput {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

/**
 * Use Case: Cleanup Sync Histories
 *
 * Responsibilities:
 * - Delete old sync history records
 * - Free up storage space
 */
export class CleanupSyncHistoriesUseCase {
  constructor(
    private syncHistoryRepository: SyncHistoryRepository,
    private logger: Logger
  ) {}

  async execute(input: CleanupSyncHistoriesInput): Promise<CleanupSyncHistoriesOutput> {
    try {
      const { olderThanDays } = input;

      this.logger.info('Cleaning up old sync histories', { olderThanDays });

      const result = await this.syncHistoryRepository.deleteOlderThan(olderThanDays);

      if (result.isFailure) {
        this.logger.error('Failed to cleanup sync histories', result.error);
        return {
          success: false,
          error: result.error!.message,
        };
      }

      const deletedCount = result.value!;

      this.logger.info('Cleanup completed', { deletedCount });

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      this.logger.error('Failed to cleanup sync histories', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
