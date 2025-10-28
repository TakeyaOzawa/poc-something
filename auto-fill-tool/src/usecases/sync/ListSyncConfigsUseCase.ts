/**
 * Use Case: List Sync Configs
 * Lists storage sync configurations with optional filtering
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';

export interface ListSyncConfigsInput {
  /**
   * If true, only return enabled periodic sync configs
   */
  enabledPeriodicOnly?: boolean;

  /**
   * If specified, only return configs for this storage key
   */
  storageKey?: string;
}

export interface ListSyncConfigsOutput {
  success: boolean;
  configs?: StorageSyncConfig[];
  count?: number;
  error?: string;
}

export class ListSyncConfigsUseCase {
  constructor(
    private repository: StorageSyncConfigRepository,
    private logger: Logger
  ) {}

  async execute(input: ListSyncConfigsInput = {}): Promise<ListSyncConfigsOutput> {
    this.logger.info('Listing sync configs');

    let configs: StorageSyncConfig[];

    if (input.storageKey) {
      // Load specific config by storage key
      this.logger.debug(`Loading config for storage key: ${input.storageKey}`);
      const configResult = await this.repository.loadByStorageKey(input.storageKey);
      if (configResult.isFailure) {
        this.logger.error('Failed to list sync configs', configResult.error);
        return {
          success: false,
          error: configResult.error!.message,
        };
      }
      const config = configResult.value;
      configs = config ? [config] : [];
    } else if (input.enabledPeriodicOnly) {
      // Load only enabled periodic sync configs
      this.logger.debug('Loading enabled periodic sync configs');
      const configsResult = await this.repository.loadAllEnabledPeriodic();
      if (configsResult.isFailure) {
        this.logger.error('Failed to list sync configs', configsResult.error);
        return {
          success: false,
          error: configsResult.error!.message,
        };
      }
      configs = configsResult.value!;
    } else {
      // Load all configs
      this.logger.debug('Loading all sync configs');
      const configsResult = await this.repository.loadAll();
      if (configsResult.isFailure) {
        this.logger.error('Failed to list sync configs', configsResult.error);
        return {
          success: false,
          error: configsResult.error!.message,
        };
      }
      configs = configsResult.value!;
    }

    this.logger.info(`Found ${configs.length} sync config(s)`);

    return {
      success: true,
      configs,
      count: configs.length,
    };
  }
}
