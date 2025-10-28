/**
 * Infrastructure Repository: Chrome Storage Automation Variables Repository
 * Supports both legacy object format (V1) and new array format (V2)
 */

import browser from 'webextension-polyfill';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

// Legacy storage format (V1) - object with websiteId as key
type AutomationVariablesStorageV1 = {
  [websiteId: string]: AutomationVariablesData;
};

// New storage format (V2) - array
type AutomationVariablesStorageV2 = AutomationVariablesData[];

// Union type for backward compatibility
type AutomationVariablesStorage = AutomationVariablesStorageV1 | AutomationVariablesStorageV2;

export class ChromeStorageAutomationVariablesRepository implements AutomationVariablesRepository {
  constructor(private logger: Logger) {}

  /**
   * Type guard to check if storage is in array format
   */
  private isArrayFormat(
    storage: AutomationVariablesStorage
  ): storage is AutomationVariablesStorageV2 {
    return Array.isArray(storage);
  }

  async save(variables: AutomationVariables): Promise<Result<void, Error>> {
    try {
      const id = variables.getId();
      const data = variables.toData();

      // Load existing storage (always returns array format)
      const storage = await this.loadStorage();

      // Find and update, or append
      const existingIndex = storage.findIndex((v) => v.id === id);
      if (existingIndex >= 0) {
        storage[existingIndex] = data;
        this.logger.info(`Automation variables updated: ${id}`);
      } else {
        storage.push(data);
        this.logger.info(`Automation variables created: ${id}`);
      }

      // Save to storage
      await this.saveStorage(storage);
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to save automation variables', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save automation variables')
      );
    }
  }

  async load(idOrWebsiteId: string): Promise<Result<AutomationVariables | null, Error>> {
    try {
      this.logger.info(`Loading automation variables: ${idOrWebsiteId}`);
      const storage = await this.loadStorage();

      // Try to find by id first, then by websiteId
      // If searching by websiteId and multiple records exist, return the latest one (by updatedAt)
      const matchingRecords = storage.filter(
        (v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId
      );

      if (matchingRecords.length === 0) {
        this.logger.info(`No automation variables found: ${idOrWebsiteId}`);
        return Result.success(null);
      }

      // If exact ID match exists, prefer that over websiteId match
      const exactIdMatch = matchingRecords.find((v) => v.id === idOrWebsiteId);
      if (exactIdMatch) {
        return Result.success(AutomationVariables.fromExisting(exactIdMatch));
      }

      // For websiteId matches, return the latest one (by updatedAt)
      const latestRecord = matchingRecords.reduce((latest, current) => {
        return new Date(current.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
          ? current
          : latest;
      });

      this.logger.info(
        `Found ${matchingRecords.length} records for websiteId, returning latest: ${latestRecord.id}`
      );
      return Result.success(AutomationVariables.fromExisting(latestRecord));
    } catch (error) {
      this.logger.error('Failed to load automation variables', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load automation variables')
      );
    }
  }

  async loadAll(): Promise<Result<AutomationVariables[], Error>> {
    try {
      this.logger.info('Loading all automation variables');
      const storage = await this.loadStorage();

      return Result.success(storage.map((data) => AutomationVariables.fromExisting(data)));
    } catch (error) {
      this.logger.error('Failed to load all automation variables', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load all automation variables')
      );
    }
  }

  async delete(idOrWebsiteId: string): Promise<Result<void, Error>> {
    try {
      const storage = await this.loadStorage();

      const filtered = storage.filter(
        (v) => v.id !== idOrWebsiteId && v.websiteId !== idOrWebsiteId
      );

      if (filtered.length === storage.length) {
        this.logger.warn(`No automation variables found to delete: ${idOrWebsiteId}`);
      } else {
        await this.saveStorage(filtered);
        this.logger.info(`Automation variables deleted: ${idOrWebsiteId}`);
      }
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete automation variables', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete automation variables')
      );
    }
  }

  async exists(idOrWebsiteId: string): Promise<Result<boolean, Error>> {
    try {
      const storage = await this.loadStorage();
      return Result.success(
        storage.some((v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId)
      );
    } catch (error) {
      this.logger.error('Failed to check automation variables existence', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to check automation variables existence')
      );
    }
  }

  loadFromBatch(
    rawStorageData: unknown,
    idOrWebsiteId: string
  ): Result<AutomationVariables | null, Error> {
    try {
      this.logger.info('Loading automation variables from batch data', { idOrWebsiteId });

      // Validate and parse raw storage data
      if (!rawStorageData) {
        this.logger.info('No automation variables data in batch');
        return Result.success(null);
      }

      let storage: AutomationVariablesStorageV2;

      // Handle both array format (V2) and object format (V1) for backward compatibility
      if (this.isArrayFormat(rawStorageData as AutomationVariablesStorage)) {
        storage = rawStorageData as AutomationVariablesStorageV2;
        this.logger.info('AutomationVariables batch data is in array format');
      } else if (typeof rawStorageData === 'object') {
        // Convert from object format to array format
        this.logger.warn('AutomationVariables batch data is in legacy object format, converting');
        storage = Object.values(rawStorageData as AutomationVariablesStorageV1);
      } else {
        this.logger.error('Invalid automation variables batch data format');
        return Result.failure(new Error('Invalid automation variables batch data format'));
      }

      // Try to find by id first, then by websiteId
      const matchingRecords = storage.filter(
        (v) => v.id === idOrWebsiteId || v.websiteId === idOrWebsiteId
      );

      if (matchingRecords.length === 0) {
        this.logger.info(`No automation variables found in batch: ${idOrWebsiteId}`);
        return Result.success(null);
      }

      // If exact ID match exists, prefer that over websiteId match
      const exactIdMatch = matchingRecords.find((v) => v.id === idOrWebsiteId);
      if (exactIdMatch) {
        return Result.success(AutomationVariables.fromExisting(exactIdMatch));
      }

      // For websiteId matches, return the latest one (by updatedAt)
      const latestRecord = matchingRecords.reduce((latest, current) => {
        return new Date(current.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
          ? current
          : latest;
      });

      this.logger.info(
        `Found ${matchingRecords.length} records in batch for websiteId, returning latest: ${latestRecord.id}`
      );
      return Result.success(AutomationVariables.fromExisting(latestRecord));
    } catch (error) {
      this.logger.error('Failed to load automation variables from batch', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load automation variables from batch')
      );
    }
  }

  /**
   * Load storage data from Chrome storage
   * Handles both legacy object format and new array format with automatic conversion
   * @returns Always returns array format (V2)
   */
  private async loadStorage(): Promise<AutomationVariablesStorageV2> {
    const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
    const storage = result[STORAGE_KEYS.AUTOMATION_VARIABLES] as AutomationVariablesStorage;

    if (!storage) {
      return [];
    }

    // Already in array format
    if (this.isArrayFormat(storage)) {
      this.logger.info('AutomationVariables storage is in array format');
      return storage;
    }

    // Convert from object format to array format (backward compatibility)
    this.logger.warn('AutomationVariables storage is in legacy object format, converting to array');
    const arrayFormat = Object.values(storage);

    // Save converted data for next time
    await this.saveStorage(arrayFormat);

    return arrayFormat;
  }

  /**
   * Save storage data to Chrome storage in array format
   */
  private async saveStorage(data: AutomationVariablesStorageV2): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.AUTOMATION_VARIABLES]: data });
  }
}
