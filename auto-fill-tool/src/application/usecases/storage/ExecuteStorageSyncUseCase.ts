/**
 * Use Case Layer: Execute Storage Sync
 * Executes manual synchronization for a storage key (wrapper for ExecuteManualSyncUseCase)
 */

import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';
import { SyncStateNotifier } from '@domain/types/sync-state-notifier.types';
import {
  ExecuteManualSyncUseCase,
  ExecuteManualSyncOutput,
} from '../sync/ExecuteManualSyncUseCase';
import { ExecuteReceiveDataUseCase } from '../sync/ExecuteReceiveDataUseCase';
import { ExecuteSendDataUseCase } from '../sync/ExecuteSendDataUseCase';

export interface ExecuteStorageSyncInput {
  storageKey: string;
}

export class ExecuteStorageSyncUseCase {
  private executeManualSyncUseCase: ExecuteManualSyncUseCase;

  // eslint-disable-next-line max-params -- Receives 6 dependencies to initialize ExecuteManualSyncUseCase wrapper. These are distinct repositories, notifiers, and use cases that cannot be reasonably grouped.
  constructor(
    private configRepository: StorageSyncConfigRepository,
    executeReceiveDataUseCase: ExecuteReceiveDataUseCase,
    executeSendDataUseCase: ExecuteSendDataUseCase,
    syncHistoryRepository: SyncHistoryRepository,
    syncStateNotifier: SyncStateNotifier,
    idGenerator: IdGenerator,
    logger: Logger
  ) {
    this.executeManualSyncUseCase = new ExecuteManualSyncUseCase(
      executeReceiveDataUseCase,
      executeSendDataUseCase,
      syncHistoryRepository,
      syncStateNotifier,
      idGenerator,
      logger
    );
  }

  async execute(input: ExecuteStorageSyncInput): Promise<ExecuteManualSyncOutput> {
    // Load config for the storage key
    const configResult = await this.configRepository.loadByStorageKey(input.storageKey);
    if (configResult.isFailure) {
      return {
        success: false,
        syncDirection: 'bidirectional',
        error: configResult.error!.message,
      };
    }

    const config = configResult.value;
    if (!config) {
      return {
        success: false,
        syncDirection: 'bidirectional',
        error: `No sync configuration found for storage key: ${input.storageKey}`,
      };
    }

    // Execute manual sync
    return await this.executeManualSyncUseCase.execute({ config });
  }
}
