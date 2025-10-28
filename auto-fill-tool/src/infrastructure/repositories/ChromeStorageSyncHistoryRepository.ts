/**
 * Infrastructure Repository: Chrome Storage Sync History Repository
 */

import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { SyncHistory, SyncHistoryData } from '@domain/entities/SyncHistory';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import browser from 'webextension-polyfill';

const STORAGE_KEY = 'syncHistories';
const MAX_HISTORIES = 1000; // Maximum number of histories to keep

export class ChromeStorageSyncHistoryRepository implements SyncHistoryRepository {
  constructor(private logger: Logger) {}

  /**
   * Save sync history record
   */
  async save(history: SyncHistory): Promise<Result<void, Error>> {
    try {
      const histories = await this.loadAll();

      // Find existing history and update, or add new
      const index = histories.findIndex((h) => h.id === history.getId());
      if (index >= 0) {
        histories[index] = history.toData();
      } else {
        histories.push(history.toData());
      }

      // Keep only recent histories (FIFO)
      if (histories.length > MAX_HISTORIES) {
        histories.sort((a, b) => b.createdAt - a.createdAt);
        histories.splice(MAX_HISTORIES);
      }

      await this.saveAll(histories);
      this.logger.debug('Sync history saved', { id: history.getId() });
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to save sync history', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save sync history')
      );
    }
  }

  /**
   * Find sync history by ID
   */
  async findById(id: string): Promise<Result<SyncHistory | null, Error>> {
    try {
      const histories = await this.loadAll();
      const data = histories.find((h) => h.id === id);
      return Result.success(data ? SyncHistory.fromData(data) : null);
    } catch (error) {
      this.logger.error('Failed to find sync history by ID', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to find sync history by ID')
      );
    }
  }

  /**
   * Find all sync histories for a config
   */
  async findByConfigId(configId: string, limit?: number): Promise<Result<SyncHistory[], Error>> {
    try {
      const histories = await this.loadAll();
      const filtered = histories.filter((h) => h.configId === configId);

      // Sort by created time (newest first)
      filtered.sort((a, b) => b.createdAt - a.createdAt);

      // Apply limit if specified
      const limited = limit ? filtered.slice(0, limit) : filtered;

      return Result.success(limited.map((data) => SyncHistory.fromData(data)));
    } catch (error) {
      this.logger.error('Failed to find sync histories by config ID', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to find sync histories by config ID')
      );
    }
  }

  /**
   * Find recent sync histories
   */
  async findRecent(limit: number): Promise<Result<SyncHistory[], Error>> {
    try {
      const histories = await this.loadAll();

      // Sort by created time (newest first)
      histories.sort((a, b) => b.createdAt - a.createdAt);

      // Apply limit
      const limited = histories.slice(0, limit);

      return Result.success(limited.map((data) => SyncHistory.fromData(data)));
    } catch (error) {
      this.logger.error('Failed to find recent sync histories', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to find recent sync histories')
      );
    }
  }

  /**
   * Delete sync history by ID
   */
  async delete(id: string): Promise<Result<void, Error>> {
    try {
      const histories = await this.loadAll();
      const filtered = histories.filter((h) => h.id !== id);
      await this.saveAll(filtered);
      this.logger.debug('Sync history deleted', { id });
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete sync history', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete sync history')
      );
    }
  }

  /**
   * Delete old sync histories (older than specified days)
   */
  async deleteOlderThan(days: number): Promise<Result<number, Error>> {
    try {
      const histories = await this.loadAll();
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

      const filtered = histories.filter((h) => h.createdAt >= cutoffTime);
      const deletedCount = histories.length - filtered.length;

      if (deletedCount > 0) {
        await this.saveAll(filtered);
        this.logger.info('Deleted old sync histories', { deletedCount, days });
      }

      return Result.success(deletedCount);
    } catch (error) {
      this.logger.error('Failed to delete old sync histories', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete old sync histories')
      );
    }
  }

  /**
   * Get total count of sync histories
   */
  async count(): Promise<Result<number, Error>> {
    try {
      const histories = await this.loadAll();
      return Result.success(histories.length);
    } catch (error) {
      this.logger.error('Failed to count sync histories', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to count sync histories')
      );
    }
  }

  /**
   * Get count of sync histories for a config
   */
  async countByConfigId(configId: string): Promise<Result<number, Error>> {
    try {
      const histories = await this.loadAll();
      return Result.success(histories.filter((h) => h.configId === configId).length);
    } catch (error) {
      this.logger.error('Failed to count sync histories by config ID', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to count sync histories by config ID')
      );
    }
  }

  /**
   * Load all sync histories from storage
   */
  private async loadAll(): Promise<SyncHistoryData[]> {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const histories = result[STORAGE_KEY];
    return Array.isArray(histories) ? histories : [];
  }

  /**
   * Save all sync histories to storage
   */
  private async saveAll(histories: SyncHistoryData[]): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEY]: histories });
  }
}
