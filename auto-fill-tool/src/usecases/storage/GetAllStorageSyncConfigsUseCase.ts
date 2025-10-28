/**
 * Use Case Layer: Get All Storage Sync Configs
 * Retrieves all storage sync configurations (wrapper for ListSyncConfigsUseCase)
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';
import { ListSyncConfigsUseCase } from '../sync/ListSyncConfigsUseCase';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface GetAllStorageSyncConfigsInput {}

export class GetAllStorageSyncConfigsUseCase {
  private listSyncConfigsUseCase: ListSyncConfigsUseCase;

  constructor(repository: StorageSyncConfigRepository, logger: Logger) {
    this.listSyncConfigsUseCase = new ListSyncConfigsUseCase(repository, logger);
  }

  async execute(_input: GetAllStorageSyncConfigsInput = {}): Promise<StorageSyncConfig[]> {
    const result = await this.listSyncConfigsUseCase.execute({});

    if (!result.success || !result.configs) {
      return [];
    }

    return result.configs;
  }
}
