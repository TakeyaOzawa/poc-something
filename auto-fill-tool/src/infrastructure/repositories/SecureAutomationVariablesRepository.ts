/**
 * Infrastructure Layer: Secure Automation Variables Repository
 * Implements AutomationVariablesRepository with encryption using SecureStorage
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';

/**
 * Secure Automation Variables Repository
 * Encrypts and stores automation variables data using SecureStorage
 *
 * Storage Structure:
 * {
 *   "websiteId1": AutomationVariablesData,
 *   "websiteId2": AutomationVariablesData,
 *   ...
 * }
 */
export class SecureAutomationVariablesRepository implements AutomationVariablesRepository {
  private readonly STORAGE_KEY = 'automation_variables';

  constructor(private secureStorage: SecureStorage) {}

  /**
   * Save automation variables for a specific website (encrypted)
   * @param variables Automation variables entity
   */
  async save(variables: AutomationVariables): Promise<Result<void, Error>> {
    try {
      this.checkSession();

      // Convert entity to data format
      const data = variables.toData();

      // Load existing data
      const allData = await this.loadAllData();

      // Update data
      allData[variables.getWebsiteId()] = data;

      // Save encrypted
      await this.secureStorage.saveEncrypted(this.STORAGE_KEY, allData);

      // Extend session
      this.extendSession();
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save automation variables')
      );
    }
  }

  /**
   * Load automation variables for a specific website (decrypted)
   * @param websiteId Website ID
   * @returns Automation variables entity or null if not found
   */
  async load(websiteId: string): Promise<Result<AutomationVariables | null, Error>> {
    try {
      this.checkSession();

      // Load and decrypt all data
      const allData = await this.loadAllData();

      // Get data for specific website
      const data = allData[websiteId];
      if (!data) {
        this.extendSession();
        return Result.success(null);
      }

      // Convert to entity
      const entity = AutomationVariables.fromExisting(data);

      // Extend session
      this.extendSession();

      return Result.success(entity);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load automation variables')
      );
    }
  }

  /**
   * Load all automation variables (decrypted)
   * @returns Array of automation variables entities
   */
  async loadAll(): Promise<Result<AutomationVariables[], Error>> {
    try {
      this.checkSession();

      // Load and decrypt all data
      const allData = await this.loadAllData();

      // Convert to entities
      const entities = Object.values(allData).map((data) => AutomationVariables.fromExisting(data));

      // Extend session
      this.extendSession();

      return Result.success(entities);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load all automation variables')
      );
    }
  }

  /**
   * Delete automation variables for a specific website
   * @param websiteId Website ID
   */
  async delete(websiteId: string): Promise<Result<void, Error>> {
    try {
      this.checkSession();

      // Load existing data
      const allData = await this.loadAllData();

      // Delete data
      delete allData[websiteId];

      // Save encrypted
      await this.secureStorage.saveEncrypted(this.STORAGE_KEY, allData);

      // Extend session
      this.extendSession();
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete automation variables')
      );
    }
  }

  /**
   * Check if automation variables exist for a specific website
   * @param websiteId Website ID
   * @returns True if exists
   */
  async exists(websiteId: string): Promise<Result<boolean, Error>> {
    try {
      // If locked, return false (cannot check)
      if (!this.secureStorage.isUnlocked()) {
        return Result.success(false);
      }

      // Load all data
      const allData = await this.loadAllData();

      // Check existence
      const result = websiteId in allData;

      // Extend session
      this.extendSession();

      return Result.success(result);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to check automation variables existence')
      );
    }
  }

  /**
   * Load automation variables from batch-loaded raw storage data
   * Note: Batch loading is not supported for encrypted storage as it requires
   * session management and decryption. Use the standard load() method instead.
   * @param rawStorageData Raw storage data (not used for secure storage)
   * @param websiteId Website ID
   * @returns Error indicating batch loading is not supported
   */
  loadFromBatch(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rawStorageData parameter required by interface but not used in secure storage implementation
    rawStorageData: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- websiteId parameter required by interface but not used in secure storage implementation
    websiteId: string
  ): Result<AutomationVariables | null, Error> {
    return Result.failure(
      new Error('Batch loading is not supported for encrypted storage. Use load() method instead.')
    );
  }

  /**
   * Check if storage is unlocked
   * @throws Error with descriptive message if locked
   */
  private checkSession(): void {
    if (!this.secureStorage.isUnlocked()) {
      throw new Error(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
    }
  }

  /**
   * Extend session timer
   */
  private extendSession(): void {
    this.secureStorage.extendSession();
  }

  /**
   * Load all data (decrypted)
   * @returns Map of websiteId to AutomationVariablesData
   */
  private async loadAllData(): Promise<{ [key: string]: AutomationVariablesData }> {
    const data = await this.secureStorage.loadEncrypted<{ [key: string]: AutomationVariablesData }>(
      this.STORAGE_KEY
    );
    return data || {};
  }
}
