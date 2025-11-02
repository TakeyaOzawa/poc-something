/**
 * Use Case: Update Sync Config
 * Updates an existing storage sync configuration
 *
 * @coverage 89.09%
 * @reason テストカバレッジが低い理由:
 * - 複数のバリデーションルール（同期方向に応じた受信・送信ステップの必須チェック、
 *   定期同期の間隔チェック）の全ての組み合わせをテストするには追加のテストケースが必要
 * - 設定が見つからない場合（lines 40-42）やリポジトリ保存時の例外（lines 62-68）
 *   などの特定のエラーパスは個別のテストケースが必要
 * - 現在のテストでは主要な更新フローと基本的なバリデーションをカバーしており、
 *   全てのバリデーションエラーの組み合わせには追加実装が必要
 */

import { StorageSyncConfig, SyncInput, SyncOutput } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';

export interface UpdateSyncConfigInput {
  id: string;
  enabled?: boolean;
  syncMethod?: 'notion' | 'spread-sheet';
  syncTiming?: 'manual' | 'periodic';
  syncDirection?: 'bidirectional' | 'receive_only' | 'send_only';
  syncIntervalSeconds?: number;
  inputs?: SyncInput[];
  outputs?: SyncOutput[];
  lastSyncDate?: string;
}

export interface UpdateSyncConfigOutput {
  success: boolean;
  config?: StorageSyncConfig;
  error?: string;
}

export class UpdateSyncConfigUseCase {
  constructor(
    private repository: StorageSyncConfigRepository,
    private logger: Logger
  ) {}

  async execute(input: UpdateSyncConfigInput): Promise<UpdateSyncConfigOutput> {
    this.logger.info(`Updating sync config: ${input.id}`);

    // Load existing config
    const loadResult = await this.repository.load(input.id);
    if (loadResult.isFailure) {
      this.logger.error('Failed to update sync config', loadResult.error);
      return {
        success: false,
        error: loadResult.error!.message,
      };
    }

    const existingConfig = loadResult.value;
    if (!existingConfig) {
      return this.configNotFoundError(input.id);
    }

    // Build updated config using immutable setters
    let updatedConfig: StorageSyncConfig;
    try {
      updatedConfig = this.applyUpdates(existingConfig, input);
    } catch (error) {
      this.logger.warn('Invalid configuration update', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid configuration update',
      };
    }

    // Validate updated configuration
    const validationError = this.validateUpdatedConfig(updatedConfig);
    if (validationError) {
      return validationError;
    }

    // Save updated config
    const saveResult = await this.repository.save(updatedConfig);
    if (saveResult.isFailure) {
      this.logger.error('Failed to save updated sync config', saveResult.error);
      return {
        success: false,
        error: saveResult.error!.message,
      };
    }

    this.logger.info(`Successfully updated sync config: ${input.id}`);

    return {
      success: true,
      config: updatedConfig,
    };
  }

  private configNotFoundError(id: string): UpdateSyncConfigOutput {
    this.logger.warn(`Sync config not found: ${id}`);
    return {
      success: false,
      error: `Sync configuration not found: ${id}`,
    };
  }

  private applyUpdates(config: StorageSyncConfig, input: UpdateSyncConfigInput): StorageSyncConfig {
    let updatedConfig = config;

    if (input.enabled !== undefined) {
      updatedConfig = updatedConfig.setEnabled(input.enabled);
    }

    if (input.syncTiming !== undefined || input.syncIntervalSeconds !== undefined) {
      const newTiming = input.syncTiming ?? updatedConfig.getSyncTiming();
      const newInterval = input.syncIntervalSeconds;

      // Validate periodic sync requirements
      if (newTiming === 'periodic' && (newInterval === undefined || newInterval < 1)) {
        throw new Error('Sync interval must be at least 1 second for periodic sync');
      }

      updatedConfig = updatedConfig.setSyncTiming(newTiming, newInterval);
    }

    if (input.syncDirection !== undefined) {
      updatedConfig = updatedConfig.setSyncDirection(input.syncDirection);
    }

    if (input.inputs !== undefined) {
      updatedConfig = updatedConfig.setInputs(input.inputs);
    }

    if (input.outputs !== undefined) {
      updatedConfig = updatedConfig.setOutputs(input.outputs);
    }

    return updatedConfig;
  }

  private validateUpdatedConfig(config: StorageSyncConfig): UpdateSyncConfigOutput | null {
    const syncDirectionError = this.validateSyncDirection(config);
    if (syncDirectionError) {
      return syncDirectionError;
    }

    const periodicSyncError = this.validatePeriodicSync(config);
    if (periodicSyncError) {
      return periodicSyncError;
    }

    return null;
  }

  private validateSyncDirection(config: StorageSyncConfig): UpdateSyncConfigOutput | null {
    const direction = config.getSyncDirection();

    if (direction === 'bidirectional' || direction === 'receive_only') {
      const inputs = config.getInputs();
      if (!inputs || inputs.length === 0) {
        return {
          success: false,
          error: 'Input configuration is required for bidirectional or receive-only sync',
        };
      }
    }

    if (direction === 'bidirectional' || direction === 'send_only') {
      const outputs = config.getOutputs();
      if (!outputs || outputs.length === 0) {
        return {
          success: false,
          error: 'Output configuration is required for bidirectional or send-only sync',
        };
      }
    }

    return null;
  }

  private validatePeriodicSync(config: StorageSyncConfig): UpdateSyncConfigOutput | null {
    if (config.getSyncTiming() === 'periodic') {
      const interval = config.getSyncIntervalSeconds();
      if (!interval || interval < 1) {
        return {
          success: false,
          error: 'Sync interval must be at least 1 second for periodic sync',
        };
      }
    }

    return null;
  }
}
