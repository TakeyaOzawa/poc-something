/**
 * StorageSyncConfigRepository Interface
 * ストレージ同期設定の永続化を抽象化するリポジトリインターフェース
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';

export interface StorageSyncConfigRepository {
  getAll(): Promise<StorageSyncConfig[]>;
  getById(id: string): Promise<StorageSyncConfig | undefined>;
  getByStorageKey(storageKey: string): Promise<StorageSyncConfig[]>;
  save(config: StorageSyncConfig): Promise<void>;
  update(config: StorageSyncConfig): Promise<void>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}
