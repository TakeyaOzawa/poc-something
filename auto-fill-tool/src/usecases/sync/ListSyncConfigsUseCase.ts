/**
 * ListSyncConfigsUseCase
 * 同期設定一覧を取得するユースケース
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

export class ListSyncConfigsUseCase {
  constructor(private repository: StorageSyncConfigRepository) {}

  async execute(storageKey?: string): Promise<StorageSyncConfig[]> {
    if (storageKey) {
      return await this.repository.getByStorageKey(storageKey);
    }
    return await this.repository.getAll();
  }
}
