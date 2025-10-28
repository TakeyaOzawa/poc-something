/**
 * Domain Repository Interface: Sync History Repository
 */

import { SyncHistory } from '@domain/entities/SyncHistory';
import { Result } from '@domain/values/result.value';

export interface SyncHistoryRepository {
  /**
   * Save sync history record
   */
  save(history: SyncHistory): Promise<Result<void, Error>>;

  /**
   * Find sync history by ID
   */
  findById(id: string): Promise<Result<SyncHistory | null, Error>>;

  /**
   * Find all sync histories for a config
   */
  findByConfigId(configId: string, limit?: number): Promise<Result<SyncHistory[], Error>>;

  /**
   * Find recent sync histories
   */
  findRecent(limit: number): Promise<Result<SyncHistory[], Error>>;

  /**
   * Delete sync history by ID
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Delete old sync histories (older than specified days)
   */
  deleteOlderThan(days: number): Promise<Result<number, Error>>;

  /**
   * Get total count of sync histories
   */
  count(): Promise<Result<number, Error>>;

  /**
   * Get count of sync histories for a config
   */
  countByConfigId(configId: string): Promise<Result<number, Error>>;
}
