/**
 * Application Layer: Get Sync Histories Use Case
 * Retrieves sync history records
 */

import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { SyncHistory } from '@domain/entities/SyncHistory';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

export interface GetSyncHistoriesInput {
  configId?: string;
  limit?: number;
}

export interface GetSyncHistoriesOutput {
  success: boolean;
  histories?: SyncHistory[];
  error?: string;
}

/**
 * Use Case: Get Sync Histories
 *
 * Responsibilities:
 * - Retrieve sync history records
 * - Filter by config ID if specified
 * - Limit results if specified
 */
export class GetSyncHistoriesUseCase {
  constructor(
    private syncHistoryRepository: SyncHistoryRepository,
    private logger: Logger
  ) {}

  async execute(input: GetSyncHistoriesInput): Promise<GetSyncHistoriesOutput> {
    try {
      const { configId, limit = 50 } = input;

      this.logger.debug('Getting sync histories', { configId, limit });

      let result: Result<SyncHistory[], Error>;

      if (configId) {
        // Get histories for specific config
        result = await this.syncHistoryRepository.findByConfigId(configId, limit);
      } else {
        // Get recent histories
        result = await this.syncHistoryRepository.findRecent(limit);
      }

      if (result.isFailure) {
        this.logger.error('Failed to get sync histories', result.error);
        return {
          success: false,
          error: result.error!.message,
        };
      }

      const histories = result.value!;

      this.logger.info('Retrieved sync histories', {
        count: histories.length,
        configId,
      });

      return {
        success: true,
        histories,
      };
    } catch (error) {
      this.logger.error('Failed to get sync histories', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
