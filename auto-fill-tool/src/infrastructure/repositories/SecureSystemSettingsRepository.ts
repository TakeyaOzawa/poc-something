/**
 * Infrastructure Layer: Secure System Settings Repository
 * Implements SystemSettingsRepository with encryption using SecureStorage
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';

/**
 * Secure System Settings Repository
 * Encrypts and stores system settings data using SecureStorage
 *
 * Storage Structure:
 * Encrypted SystemSettings object
 */
export class SecureSystemSettingsRepository implements SystemSettingsRepository {
  private readonly STORAGE_KEY = 'system_settings';

  constructor(private secureStorage: SecureStorage) {}

  /**
   * Save system settings collection (encrypted)
   * @param collection System settings collection entity
   * @returns Result with void on success, Error on failure
   */
  async save(collection: SystemSettingsCollection): Promise<Result<void, Error>> {
    try {
      this.checkSession();

      // Convert collection to plain settings object
      const settings = collection.getAll();

      // Save encrypted
      await this.secureStorage.saveEncrypted(this.STORAGE_KEY, settings);

      // Extend session
      this.extendSession();

      return Result.success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(`Failed to save system settings: ${message}`));
    }
  }

  /**
   * Load system settings collection (decrypted)
   * @returns Result with system settings collection entity on success, Error on failure
   */
  async load(): Promise<Result<SystemSettingsCollection, Error>> {
    try {
      this.checkSession();

      // Load and decrypt data
      const settingsResult = await this.secureStorage.loadEncrypted<any>(this.STORAGE_KEY);

      // If no data exists, return default collection
      if (!settingsResult.isSuccess || !settingsResult.value) {
        this.extendSession();
        return Result.success(new SystemSettingsCollection());
      }

      // Reconstruct collection from settings
      const collection = new SystemSettingsCollection(settingsResult.value);

      // Extend session
      this.extendSession();

      return Result.success(collection);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(`Failed to load system settings: ${message}`));
    }
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
}
