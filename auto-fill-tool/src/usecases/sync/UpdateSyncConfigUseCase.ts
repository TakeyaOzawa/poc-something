/**
 * UpdateSyncConfigUseCase
 * 同期設定を更新するユースケース
 */

import { StorageSyncConfig, SyncMethod, SyncTiming, SyncDirection, ConflictResolution, SyncInput, SyncOutput } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

export interface UpdateSyncConfigInput {
  syncMethod?: SyncMethod;
  syncTiming?: SyncTiming;
  syncDirection?: SyncDirection;
  conflictResolution?: ConflictResolution;
  syncIntervalSeconds?: number;
  inputs?: SyncInput[];
  outputs?: SyncOutput[];
  enabled?: boolean;
}

export class UpdateSyncConfigUseCase {
  constructor(private repository: StorageSyncConfigRepository) {}

  async execute(id: string, input: UpdateSyncConfigInput): Promise<StorageSyncConfig> {
    const config = await this.repository.getById(id);
    if (!config) {
      throw new Error('同期設定が見つかりません');
    }

    if (input.syncMethod) {
      config.updateSyncMethod(input.syncMethod);
    }

    if (input.syncTiming) {
      config.updateSyncTiming(input.syncTiming, input.syncIntervalSeconds);
    }

    if (input.syncDirection) {
      config.updateSyncDirection(input.syncDirection);
    }

    if (input.conflictResolution) {
      config.updateConflictResolution(input.conflictResolution);
    }

    if (input.inputs) {
      config.setInputs(input.inputs);
    }

    if (input.outputs) {
      config.setOutputs(input.outputs);
    }

    if (input.enabled !== undefined) {
      if (input.enabled) {
        config.enable();
      } else {
        config.disable();
      }
    }

    await this.repository.update(config);
    return config;
  }
}
