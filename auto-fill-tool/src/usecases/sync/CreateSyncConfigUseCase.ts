/**
 * CreateSyncConfigUseCase
 * 同期設定を作成するユースケース
 */

import { StorageSyncConfig, SyncMethod, SyncTiming, SyncDirection, ConflictResolution } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

export interface CreateSyncConfigInput {
  storageKey: string;
  syncMethod: SyncMethod;
  syncTiming: SyncTiming;
  syncDirection: SyncDirection;
  conflictResolution: ConflictResolution;
  syncIntervalSeconds?: number;
}

export class CreateSyncConfigUseCase {
  constructor(private repository: StorageSyncConfigRepository) {}

  async execute(input: CreateSyncConfigInput): Promise<StorageSyncConfig> {
    const config = StorageSyncConfig.create(
      input.storageKey,
      input.syncMethod,
      input.syncTiming,
      input.syncDirection,
      input.conflictResolution
    );

    if (input.syncTiming === 'periodic' && input.syncIntervalSeconds) {
      config.updateSyncTiming('periodic', input.syncIntervalSeconds);
    }

    await this.repository.save(config);
    return config;
  }
}
