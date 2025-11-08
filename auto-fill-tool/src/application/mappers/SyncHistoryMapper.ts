/**
 * SyncHistoryMapper
 * Maps SyncHistory entity to SyncHistoryOutputDto
 */

import { SyncHistory } from '@domain/entities/SyncHistory';
import { SyncHistoryOutputDto } from '@application/dtos/SyncHistoryOutputDto';

export class SyncHistoryMapper {
  /**
   * Convert SyncHistory entity to SyncHistoryOutputDto
   */
  static toOutputDto(entity: SyncHistory): SyncHistoryOutputDto {
    const data = entity.toData();
    return {
      id: data.id,
      configId: data.configId,
      storageKey: data.storageKey,
      syncDirection: data.syncDirection,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      receiveResult: data.receiveResult ?? undefined,
      sendResult: data.sendResult ?? undefined,
      error: data.error ?? undefined,
      retryCount: data.retryCount,
      createdAt: data.createdAt,
    };
  }

  static toOutputDtoArray(entities: SyncHistory[]): SyncHistoryOutputDto[] {
    return entities.map((entity) => this.toOutputDto(entity));
  }
}
