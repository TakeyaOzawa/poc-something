/**
 * Domain Repository Interface: Storage Sync Config Repository
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Result } from '@domain/values/result.value';

export interface StorageSyncConfigRepository {
  /**
   * Save storage sync config
   */
  save(config: StorageSyncConfig): Promise<Result<void, Error>>;

  /**
   * Load storage sync config by ID
   * Returns null if not found
   */
  load(id: string): Promise<Result<StorageSyncConfig | null, Error>>;

  /**
   * Load storage sync config by storage key
   * Returns null if not found
   */
  loadByStorageKey(storageKey: string): Promise<Result<StorageSyncConfig | null, Error>>;

  /**
   * Load all storage sync configs
   */
  loadAll(): Promise<Result<StorageSyncConfig[], Error>>;

  /**
   * Load all enabled storage sync configs for periodic sync
   * Returns only configs where enabled=true, syncTiming='periodic', and syncMethod='db'
   */
  loadAllEnabledPeriodic(): Promise<Result<StorageSyncConfig[], Error>>;

  /**
   * Delete storage sync config by ID
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Delete storage sync config by storage key
   */
  deleteByStorageKey(storageKey: string): Promise<Result<void, Error>>;

  /**
   * Check if storage sync config exists by ID
   */
  exists(id: string): Promise<Result<boolean, Error>>;

  /**
   * Check if storage sync config exists for storage key
   */
  existsByStorageKey(storageKey: string): Promise<Result<boolean, Error>>;
}
