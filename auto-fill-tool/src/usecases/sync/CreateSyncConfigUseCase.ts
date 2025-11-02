/**
 * Use Case: Create Sync Config
 * Creates a new storage sync configuration
 */

import { StorageSyncConfig, SyncInput, SyncOutput } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

export interface CreateSyncConfigInput {
  storageKey: string;
  enabled: boolean;
  syncMethod: 'notion' | 'spread-sheet';
  syncTiming: 'manual' | 'periodic';
  syncDirection: 'bidirectional' | 'receive_only' | 'send_only';
  syncIntervalSeconds?: number;
  inputs?: SyncInput[];
  outputs?: SyncOutput[];
  lastSyncDate?: string;
}

export interface CreateSyncConfigOutput {
  success: boolean;
  config?: StorageSyncConfig;
  error?: string;
}

export class CreateSyncConfigUseCase {
  constructor(
    private repository: StorageSyncConfigRepository,
    private logger: Logger,
    private idGenerator: IdGenerator
  ) {}

  async execute(input: CreateSyncConfigInput): Promise<CreateSyncConfigOutput> {
    this.logger.info(`Creating sync config for storage key: ${input.storageKey}`);

    // Check if config already exists for this storage key
    const existingConfigResult = await this.repository.loadByStorageKey(input.storageKey);
    if (existingConfigResult.isFailure) {
      return {
        success: false,
        error: existingConfigResult.error!.message,
      };
    }

    const existingConfig = existingConfigResult.value;
    if (existingConfig) {
      return this.configAlreadyExistsError(input.storageKey);
    }

    // Validate input
    const validationError = this.validateInput(input);
    if (validationError) {
      return validationError;
    }

    // Create new config
    const config = StorageSyncConfig.create(
      {
        storageKey: input.storageKey,
        syncMethod: input.syncMethod,
        syncTiming: input.syncTiming,
        syncDirection: input.syncDirection,
        syncIntervalSeconds: input.syncIntervalSeconds,
        inputs: input.inputs || [],
        outputs: input.outputs || [],
      },
      this.idGenerator
    );

    // Save to repository
    const saveResult = await this.repository.save(config);
    if (saveResult.isFailure) {
      this.logger.error('Failed to save sync config', saveResult.error);
      return {
        success: false,
        error: saveResult.error!.message,
      };
    }

    this.logger.info(`Successfully created sync config: ${config.getId()}`);

    return {
      success: true,
      config,
    };
  }

  private configAlreadyExistsError(storageKey: string): CreateSyncConfigOutput {
    this.logger.warn(`Sync config already exists for storage key: ${storageKey}`);
    return {
      success: false,
      error: `Sync configuration already exists for storage key: ${storageKey}`,
    };
  }

  private validateInput(input: CreateSyncConfigInput): CreateSyncConfigOutput | null {
    const syncDirectionError = this.validateSyncDirection(input);
    if (syncDirectionError) {
      return syncDirectionError;
    }

    const periodicSyncError = this.validatePeriodicSync(input);
    if (periodicSyncError) {
      return periodicSyncError;
    }

    return null;
  }

  private validateSyncDirection(input: CreateSyncConfigInput): CreateSyncConfigOutput | null {
    if (input.syncDirection === 'bidirectional' || input.syncDirection === 'receive_only') {
      if (!input.inputs || input.inputs.length === 0) {
        return {
          success: false,
          error: 'Input configuration is required for bidirectional or receive-only sync',
        };
      }
    }

    if (input.syncDirection === 'bidirectional' || input.syncDirection === 'send_only') {
      if (!input.outputs || input.outputs.length === 0) {
        return {
          success: false,
          error: 'Output configuration is required for bidirectional or send-only sync',
        };
      }
    }

    return null;
  }

  private validatePeriodicSync(input: CreateSyncConfigInput): CreateSyncConfigOutput | null {
    if (input.syncTiming === 'periodic') {
      if (!input.syncIntervalSeconds || input.syncIntervalSeconds < 1) {
        return {
          success: false,
          error: 'Sync interval must be at least 1 second for periodic sync',
        };
      }
    }

    return null;
  }
}
