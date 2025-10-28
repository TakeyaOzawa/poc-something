/**
 * Infrastructure Repository: Chrome Storage Storage Sync Config Repository
 */

import browser from 'webextension-polyfill';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { StorageSyncConfig, StorageSyncConfigData } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

type StorageSyncConfigStorage = StorageSyncConfigData[];

export class ChromeStorageStorageSyncConfigRepository implements StorageSyncConfigRepository {
  constructor(private logger: Logger) {}

  async save(config: StorageSyncConfig): Promise<Result<void, Error>> {
    try {
      const id = config.getId();
      const data = config.toData();

      const storage = await this.loadStorage();

      // Find and update, or append
      const existingIndex = storage.findIndex((c) => c.id === id);
      if (existingIndex >= 0) {
        storage[existingIndex] = data;
        this.logger.info(`Storage sync config updated: ${id}`);
      } else {
        storage.push(data);
        this.logger.info(`Storage sync config created: ${id}`);
      }

      await this.saveStorage(storage);
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to save storage sync config', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save storage sync config')
      );
    }
  }

  async load(id: string): Promise<Result<StorageSyncConfig | null, Error>> {
    try {
      this.logger.info(`Loading storage sync config: ${id}`);
      const storage = await this.loadStorage();

      const data = storage.find((c) => c.id === id);

      if (!data) {
        this.logger.info(`No storage sync config found: ${id}`);
        return Result.success(null);
      }

      return Result.success(new StorageSyncConfig(data));
    } catch (error) {
      this.logger.error('Failed to load storage sync config', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load storage sync config')
      );
    }
  }

  async loadByStorageKey(storageKey: string): Promise<Result<StorageSyncConfig | null, Error>> {
    try {
      this.logger.info(`Loading storage sync config by storage key: ${storageKey}`);
      const storage = await this.loadStorage();

      const data = storage.find((c) => c.storageKey === storageKey);

      if (!data) {
        this.logger.info(`No storage sync config found for storage key: ${storageKey}`);
        return Result.success(null);
      }

      return Result.success(new StorageSyncConfig(data));
    } catch (error) {
      this.logger.error('Failed to load storage sync config by storage key', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to load storage sync config by storage key')
      );
    }
  }

  async loadAll(): Promise<Result<StorageSyncConfig[], Error>> {
    try {
      this.logger.info('Loading all storage sync configs');
      const storage = await this.loadStorage();

      return Result.success(storage.map((data) => new StorageSyncConfig(data)));
    } catch (error) {
      this.logger.error('Failed to load all storage sync configs', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load all storage sync configs')
      );
    }
  }

  async loadAllEnabledPeriodic(): Promise<Result<StorageSyncConfig[], Error>> {
    try {
      this.logger.info('Loading all enabled periodic storage sync configs');
      const storage = await this.loadStorage();

      const filtered = storage.filter((c) => c.enabled && c.syncTiming === 'periodic');

      return Result.success(filtered.map((data) => new StorageSyncConfig(data)));
    } catch (error) {
      this.logger.error('Failed to load enabled periodic storage sync configs', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to load enabled periodic storage sync configs')
      );
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      const storage = await this.loadStorage();

      const filtered = storage.filter((c) => c.id !== id);

      if (filtered.length === storage.length) {
        this.logger.warn(`No storage sync config found to delete: ${id}`);
      } else {
        await this.saveStorage(filtered);
        this.logger.info(`Storage sync config deleted: ${id}`);
      }

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete storage sync config', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete storage sync config')
      );
    }
  }

  async deleteByStorageKey(storageKey: string): Promise<Result<void, Error>> {
    try {
      const storage = await this.loadStorage();

      const filtered = storage.filter((c) => c.storageKey !== storageKey);

      if (filtered.length === storage.length) {
        this.logger.warn(`No storage sync config found to delete for storage key: ${storageKey}`);
      } else {
        await this.saveStorage(filtered);
        this.logger.info(`Storage sync config deleted for storage key: ${storageKey}`);
      }

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete storage sync config by storage key', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to delete storage sync config by storage key')
      );
    }
  }

  async exists(id: string): Promise<Result<boolean, Error>> {
    try {
      const storage = await this.loadStorage();
      return Result.success(storage.some((c) => c.id === id));
    } catch (error) {
      this.logger.error('Failed to check storage sync config existence', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to check storage sync config existence')
      );
    }
  }

  async existsByStorageKey(storageKey: string): Promise<Result<boolean, Error>> {
    try {
      const storage = await this.loadStorage();
      return Result.success(storage.some((c) => c.storageKey === storageKey));
    } catch (error) {
      this.logger.error('Failed to check storage sync config existence by storage key', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to check storage sync config existence by storage key')
      );
    }
  }

  /**
   * Load storage data from Chrome storage
   * @returns Array of storage sync config data
   */
  private async loadStorage(): Promise<StorageSyncConfigStorage> {
    const result = await browser.storage.local.get(STORAGE_KEYS.STORAGE_SYNC_CONFIGS);
    const storage = result[STORAGE_KEYS.STORAGE_SYNC_CONFIGS] as StorageSyncConfigStorage;

    if (!storage) {
      return [];
    }

    return storage;
  }

  /**
   * Save storage data to Chrome storage
   */
  private async saveStorage(data: StorageSyncConfigStorage): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: data });
  }
}
