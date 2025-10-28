/**
 * Use Case: Delete Sync Config
 * Deletes a storage sync configuration
 */

import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';

export interface DeleteSyncConfigInput {
  id: string;
}

export interface DeleteSyncConfigOutput {
  success: boolean;
  error?: string;
}

export class DeleteSyncConfigUseCase {
  constructor(
    private repository: StorageSyncConfigRepository,
    private logger: Logger
  ) {}

  async execute(input: DeleteSyncConfigInput): Promise<DeleteSyncConfigOutput> {
    this.logger.info(`Deleting sync config: ${input.id}`);

    // Check if config exists
    const existsResult = await this.repository.exists(input.id);
    if (existsResult.isFailure) {
      this.logger.error('Failed to delete sync config', existsResult.error);
      return {
        success: false,
        error: existsResult.error!.message,
      };
    }

    if (!existsResult.value!) {
      this.logger.warn(`Sync config not found: ${input.id}`);
      return {
        success: false,
        error: `Sync configuration not found: ${input.id}`,
      };
    }

    // Delete config
    const deleteResult = await this.repository.delete(input.id);
    if (deleteResult.isFailure) {
      this.logger.error('Failed to delete sync config', deleteResult.error);
      return {
        success: false,
        error: deleteResult.error!.message,
      };
    }

    this.logger.info(`Successfully deleted sync config: ${input.id}`);

    return {
      success: true,
    };
  }
}
