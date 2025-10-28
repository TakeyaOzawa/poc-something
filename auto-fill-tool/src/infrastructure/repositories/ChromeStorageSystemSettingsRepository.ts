/**
 * Infrastructure Layer: Chrome Storage System Settings Repository
 */

import browser from 'webextension-polyfill';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { SystemSettingsMapper } from '@infrastructure/mappers/SystemSettingsMapper';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

export class ChromeStorageSystemSettingsRepository implements SystemSettingsRepository {
  constructor(private logger: Logger) {}

  async save(collection: SystemSettingsCollection): Promise<Result<void, Error>> {
    try {
      const json = SystemSettingsMapper.toJSON(collection);
      await browser.storage.local.set({ [STORAGE_KEYS.SYSTEM_SETTINGS]: json });
      this.logger.info('System settings saved to storage');
      return Result.success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(`Failed to save system settings: ${message}`));
    }
  }

  async load(): Promise<Result<SystemSettingsCollection, Error>> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEYS.SYSTEM_SETTINGS);
      const json = result[STORAGE_KEYS.SYSTEM_SETTINGS] as string;

      if (!json) {
        this.logger.info('No system settings found in storage, returning default settings');
        return Result.success(new SystemSettingsCollection());
      }

      this.logger.info('Loading system settings from storage');
      const collection = SystemSettingsMapper.fromJSON(json, this.logger);
      return Result.success(collection);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(`Failed to load system settings: ${message}`));
    }
  }
}
