/**
 * Application Layer: StorageSyncConfig Mapper
 * Maps domain entities to DTOs
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigOutputDto } from '../dtos/StorageSyncConfigOutputDto';

export class StorageSyncConfigMapper {
  static toOutputDto(entity: StorageSyncConfig): StorageSyncConfigOutputDto {
    return {
      id: entity.getId(),
      storageKey: entity.getStorageKey(),
      enabled: entity.isEnabled(),
      syncMethod: entity.getSyncMethod(),
      syncTiming: entity.getSyncTiming(),
      syncDirection: entity.getSyncDirection(),
      conflictResolution: entity.getConflictResolution(),
      syncIntervalSeconds: entity.getSyncIntervalSeconds() || 0,
      inputs: entity.getInputs().map((input) => ({ key: input.key, value: String(input.value) })),
      outputs: entity.getOutputs(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }

  static toOutputDtoArray(entities: StorageSyncConfig[]): StorageSyncConfigOutputDto[] {
    return entities.map((entity) => this.toOutputDto(entity));
  }

  /**
   * Convert StorageSyncConfigOutputDto back to StorageSyncConfig entity
   * Note: This is needed for cases where DTO is used in place of entity
   */
  static fromOutputDto(dto: StorageSyncConfigOutputDto): StorageSyncConfig {
    const configData: any = {
      id: dto.id,
      storageKey: dto.storageKey,
      enabled: dto.enabled,
      syncMethod: dto.syncMethod as 'notion' | 'spread-sheet',
      syncTiming: dto.syncTiming as 'manual' | 'periodic',
      syncDirection: dto.syncDirection as 'bidirectional' | 'receive_only' | 'send_only',
      conflictResolution: dto.conflictResolution as
        | 'latest_timestamp'
        | 'local_priority'
        | 'remote_priority'
        | 'user_confirm',
      inputs: dto.inputs,
      outputs: dto.outputs,
      retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableErrors: [],
      }, // デフォルト値
      transformerConfig: {
        id: 'default-transformer',
        name: 'Default Transformer',
        transformationRules: [],
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, // デフォルト値
      batchConfig: {
        id: 'default-batch',
        name: 'Default Batch Config',
        chunkSize: 100,
        processingMode: 'sequential' as const,
        errorHandling: 'continue-on-error' as const,
        retryFailedBatches: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, // デフォルト値
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };

    // syncIntervalSecondsは条件付きで追加
    if (dto.syncIntervalSeconds !== undefined) {
      configData.syncIntervalSeconds = dto.syncIntervalSeconds;
    }

    return new StorageSyncConfig(configData);
  }
}
