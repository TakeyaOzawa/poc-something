/**
 * DeleteSyncConfigUseCase
 * 同期設定を削除するユースケース
 */

import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

export class DeleteSyncConfigUseCase {
  constructor(private repository: StorageSyncConfigRepository) {}

  async execute(id: string): Promise<boolean> {
    return await this.repository.delete(id);
  }
}
